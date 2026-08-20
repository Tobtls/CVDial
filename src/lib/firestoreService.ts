import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { ResumeData, SavedResumeRecord, UserActivityRecord } from '../types';

// Collection references
const USERS_COL = 'users';
const RESUMES_COL = 'saved_resumes';
const ACTIVITIES_COL = 'user_activities';

/**
 * Save or update user profile information
 */
export async function syncUserProfile(uid: string, email: string, displayName: string) {
  try {
    const userRef = doc(db, USERS_COL, uid);
    const existing = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!existing.exists()) {
      await setDoc(userRef, {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await setDoc(
        userRef,
        {
          email,
          displayName: displayName || existing.data()?.displayName || email.split('@')[0],
          updatedAt: now,
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
  }
}

/**
 * Save a resume (or update existing) in Firestore
 */
export async function saveResumeToFirestore(
  userId: string,
  title: string,
  targetRole: string,
  resumeData: ResumeData,
  tailoredResumeData?: ResumeData | null,
  atsScore?: number,
  coverLetter?: string,
  existingId?: string
): Promise<string> {
  const resumeId = existingId || `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  const record: SavedResumeRecord = {
    id: resumeId,
    userId,
    title: title || resumeData.title || 'My Resume',
    targetRole: targetRole || 'General Role',
    resumeData,
    tailoredResumeData: tailoredResumeData || null,
    atsScore: atsScore || 0,
    coverLetter: coverLetter || '',
    createdAt: now,
    updatedAt: now,
  };

  // Convert nested objects to clean JSON strings for reliable Firestore storage
  const firestoreData = {
    ...record,
    resumeData: JSON.stringify(resumeData),
    tailoredResumeData: tailoredResumeData ? JSON.stringify(tailoredResumeData) : '',
  };

  const resumeRef = doc(db, RESUMES_COL, resumeId);
  await setDoc(resumeRef, firestoreData, { merge: true });

  // Log user activity
  await logUserActivity(userId, 'resume_tailored', targetRole || 'Custom Role', atsScore);

  return resumeId;
}

/**
 * Fetch all saved resumes for a specific user
 */
export async function fetchUserResumes(userId: string): Promise<SavedResumeRecord[]> {
  try {
    const q = query(
      collection(db, RESUMES_COL),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const resumes: SavedResumeRecord[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      try {
        const parsedResumeData: ResumeData =
          typeof data.resumeData === 'string' ? JSON.parse(data.resumeData) : data.resumeData;
        const parsedTailored: ResumeData | null =
          data.tailoredResumeData && typeof data.tailoredResumeData === 'string'
            ? JSON.parse(data.tailoredResumeData)
            : data.tailoredResumeData || null;

        resumes.push({
          id: d.id,
          userId: data.userId,
          title: data.title || 'Untitled Resume',
          targetRole: data.targetRole || 'Target Role',
          resumeData: parsedResumeData,
          tailoredResumeData: parsedTailored,
          atsScore: data.atsScore || 0,
          coverLetter: data.coverLetter || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error parsing stored resume record:', err);
      }
    });

    // Sort by updated timestamp desc
    return resumes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('Error fetching resumes from firestore:', error);
    return [];
  }
}

/**
 * Delete a saved resume from Firestore
 */
export async function deleteResumeFromFirestore(resumeId: string): Promise<void> {
  const resumeRef = doc(db, RESUMES_COL, resumeId);
  await deleteDoc(resumeRef);
}

/**
 * Log user actions for progress tracking
 */
export async function logUserActivity(
  userId: string,
  actionType: 'ats_analysis' | 'resume_tailored' | 'bullet_rewritten' | 'cover_letter_generated',
  jobTitle: string,
  score?: number
) {
  try {
    const activityId = `${userId}_act_${Date.now()}`;
    const activityRef = doc(db, ACTIVITIES_COL, activityId);
    await setDoc(activityRef, {
      id: activityId,
      userId,
      actionType,
      jobTitle: jobTitle || 'General Position',
      score: score || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

/**
 * Fetch recent activity history for a user
 */
export async function fetchUserActivities(userId: string): Promise<UserActivityRecord[]> {
  try {
    const q = query(
      collection(db, ACTIVITIES_COL),
      where('userId', '==', userId),
      limit(20)
    );
    const snapshot = await getDocs(q);
    const activities: UserActivityRecord[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      activities.push({
        id: d.id,
        userId: data.userId,
        actionType: data.actionType,
        jobTitle: data.jobTitle,
        score: data.score,
        timestamp: data.timestamp,
      });
    });
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}
