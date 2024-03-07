const { auth } = require("firebase-admin");
const axios = require("axios");

class FirebaseAuth {
  constructor(url, apiKey) {
    this.url = url;
    this.client = axios.create({
      baseURL: this.url,
      timeout: 3000,
      headers: {},
    });
    this.apiKey = apiKey;
  }

  async createUserWithEmailAndPassword(
    email,
    password,
    displayName,
    phoneNumber
  ) {
    try {
      const user = await auth().createUser({
        email,
        password,
        displayName,
        phoneNumber,
      });
      console.log("Successfully created user:", user.uid);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      return error;
    }
  }

  async signInWithEmailAndPassword(email, password) {
    try {
      const user = await this.client.post(
        this.url + "signInWithPassword",
        {
          email: email,
          password: password,
          returnSecureToken: true,
        },
        {
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          params: { key: this.apiKey },
        }
      );
      console.log("Successfully signed in:", user.data);
      return user;
    } catch (error) {
      console.error("Error signing in:", error);
    }
  }

  async createUserWithPhoneNumber(phoneNumber) {
    try {
      const user = await auth().createUser({
        phoneNumber,
      });
      console.log("Successfully created user:", user.uid);
      return user.uid;
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  async signInWithGoogleToken(idToken) {
    try {
      const credential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(credential);
      const user = userCredential.user;
      console.log("Successfully signed in with Google:", user.uid);
      return user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  }

  async getUser(uid) {
    try {
      const user = await auth().getUser(uid);
      console.log("Successfully retrieved user:", user.uid);
      return user;
    } catch (error) {
      console.error("Error retrieving user:", error);
    }
  }

  async updateUser(uid, displayName, photoURL) {
    try {
      const user = await auth().updateUser(uid, {
        displayName,
        photoURL,
      });
      console.log("Successfully updated user:", user.uid);
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }

  async deleteUser(uid) {
    try {
      await auth().deleteUser(uid);
      console.log("Successfully deleted user:", uid);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  async verifyIdToken(idToken) {
    try {
      const decodedToken = await auth().verifyIdToken(idToken);
      console.log("Successfully verified ID token");
      return decodedToken;
    } catch (error) {
      console.error("Error verifying ID token:", error);
    }
  }

  async sendEmailVerification(idToken) {
    try {
      const user = await this.client.post(
        this.url + "sendOobCode",
        {
          requestType: "VERIFY_EMAIL",
          idToken: idToken
        },
        {
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          params: { key: this.apiKey },
        }
      );
      console.log("Successfully Email Sent:", user.data);
      return user;
    } catch (error) {
      console.error("Error Sending Email:", error);
    }
  }
}

module.exports = FirebaseAuth;
