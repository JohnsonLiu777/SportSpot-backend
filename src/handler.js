const admin = require("firebase-admin");
const axios = require('axios');
const serviceAccount = require("../sportspot-d0d68-firebase-adminsdk-i7wnv-d8563c7c4e.json");

const firebaseConfig = {
  apiKey: "AIzaSyAums4aGVXVkIudolgOaxfclOeVipSLePQ",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();


// Registration handler
const registerHandler = async (request, h) => {
  const { email, password, displayName } = request.payload;

  try {
      const userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: displayName,
      });

      await db.collection('users').doc(userRecord.uid).set({
          email: email,
          displayName: displayName,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return h.response({
          message: 'User created successfully',
          user: {
              uid: userRecord.uid,
              email: userRecord.email,
              displayName: userRecord.displayName
          }
      }).code(201);
  } catch (error) {
      console.error('Error creating user:', error);
      return h.response({
          message: 'User creation failed',
          error: error.message,
      }).code(400);
  }
}




// Login handler
const loginHandler = async (request, h) => {
  const { email, password } = request.payload;

  try {
      const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
          email: email,
          password: password,
          returnSecureToken: true,
      });

      const user = await admin.auth().getUser(response.data.localId);

      const idToken = response.data.idToken;

      return h.response({
          message: 'Login successful',
          user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
          },
          token: idToken,
      }).code(200);
  } catch (error) {
      console.error('Error logging in:', error.response.data);
      return h.response({
          message: 'Login failed',
          error: error.response.data.error.message,
      }).code(401);
  }
}


//Profile Handler
const profileHandler = async (request, h) => {
  const userId = request.user.uid;

  try {
      const userDoc = await admin.firestore().collection('users').doc(userId).get();

      if (!userDoc.exists) {
          console.error('User not found:', userId);
          return h.response({ message: 'User not found' }).code(404);
      }

      console.log('User data fetched successfully:', userDoc.data());
      return h.response(userDoc.data()).code(200);
  } catch (error) {
      console.error('Error fetching user data:', error);
      return h.response({ message: 'Error fetching user data', error: error.message }).code(500);
  }
};


//Lapangan
//addlapangan handler
const addFieldHandler = async (request, h) => {
  const { lapanganName, lapanganType, location, openingHours, subFields } = request.payload;

  try {
      const docRef = admin.firestore().collection('lapangans').doc();
      await docRef.set({
          lapanganName: lapanganName,
          lapanganType: lapanganType,
          location: location,
          openingHours: {
              start: openingHours.start,
              end: openingHours.end
          },
          subFields: subFields.map(field => ({
              ...field
          })),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return h.response({ message: 'Lapangan and sub-fields added successfully' }).code(201);
  } catch (error) {
      console.error('Error adding lapangan and sub-fields:', error);
      return h.response({ message: 'Error adding lapangan and sub-fields', error: error.message }).code(400);
  }
};


//Malihat daftar lapangan
//getfield handler
const getFieldHandler = async (request, h) => {
  try {
      const lapangansSnapshot = await admin.firestore().collection('lapangans').get();
      const lapangans = lapangansSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));

      return h.response(lapangans).code(200);
  } catch (error) {
      console.error('Error fetching lapangans:', error);
      return h.response({ message: 'Error fetching lapangans', error: error.message }).code(500);
  }
}

//Melihat lapangan by id
//getfieldbyid handler
const getFieldByidHandler = async (request, h) => {
  const { id } = request.params;

  try {
      const lapanganDoc = await admin.firestore().collection('lapangans').doc(id).get();

      if (!lapanganDoc.exists) {
          return h.response({ message: 'Lapangan not found' }).code(404);
      }

      return h.response(lapanganDoc.data()).code(200);
  } catch (error) {
      console.error('Error fetching lapangan:', error);
      return h.response({ message: 'Error fetching lapangan', error: error.message }).code(500);
  }
}







// Protected route handler
const protectedHandler = async (request, h) => {
  return h.response({ message: "You have access to this route" }).code(200);
};

module.exports = {
  registerHandler,
  loginHandler,
  profileHandler,
  addFieldHandler,
  getFieldHandler,
  getFieldByidHandler,
  protectedHandler,
};
