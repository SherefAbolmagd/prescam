const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// eslint-disable-next-line require-jsdoc
class FirebaseCollection {
  // eslint-disable-next-line require-jsdoc
  constructor(name) {
    this.collection = getFirestore().collection(name);
  }
  // eslint-disable-next-line require-jsdoc
  async all() {
    const query = await this.collection.get();
    return query.docs.map((doc) => {
      const object = doc.data();
      object.id = doc.id;
      return object;
    });
  }
  // eslint-disable-next-line require-jsdoc
  async one(id) {
    const doc = await this.collection.doc(id).get();
    let object = null;
    if (doc.exists) {
      // @ts-ignore
      object = doc.data();
    }
    // @ts-ignore
    return object;
  }
  // eslint-disable-next-line require-jsdoc
  async delete(id) {
    return await this.collection.doc(id).delete();
  }
  // eslint-disable-next-line require-jsdoc
  async add(object) {
    object["updated_at"] = new Date();
    object["created_at"] = new Date();

    const ref = this.collection.add(JSON.parse(JSON.stringify(object)));
    object["id"] = ref.id;
    return object;
  }
  // eslint-disable-next-line require-jsdoc
  async addWithId(id, object) {
    object["updated_at"] = new Date();
    object["created_at"] = new Date();

    const ref = this.collection.doc(id).set(JSON.parse(JSON.stringify(object)));
    object["id"] = ref.id;
    return object;
  }
  // eslint-disable-next-line require-jsdoc
  async update(id, change) {
    change["updated_at"] = new Date();
    await this.collection.doc(id).update(JSON.parse(JSON.stringify(change)));
    return change;
  }
  // eslint-disable-next-line require-jsdoc
  async updateAppendMessage(id, change, message) {
    change["updated_at"] = new Date();
    await this.collection
      .doc(id)
      .update({ messages: FieldValue.arrayUnion(message) });
    return change;
  }
  // eslint-disable-next-line require-jsdoc
  async whereEqualTo(field, value) {
    let object = [];
    await this.collection
      .where(field, "==", value)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          object.push({ id: doc.id, ...doc.data() });
        });
      });
    // @ts-ignore
    return object;
  }
}

module.exports = FirebaseCollection;
