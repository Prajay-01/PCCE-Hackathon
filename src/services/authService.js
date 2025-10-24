import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Authentication functions
export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update profile with name
    await user.updateProfile({
      displayName: name
    });
    
    // Create user document in Firestore
    await firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      name: name,
      email: email,
      createdAt: firestore.FieldValue.serverTimestamp(),
      connectedPlatforms: [],
      profilePicture: null
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await auth().signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth().currentUser;
};

export const onAuthChange = (callback) => {
  return auth().onAuthStateChanged(callback);
};

export { auth, firestore };
