const userLoginValidateSchema = {
  password: {
    exists: { errorMessage: "Password is required" },
    isString: { errorMessage: "password should be string" },
    isLength: {
      options: { min: 5 },
      errorMessage: "Password should be at least 5 characters",
    },
  },
  email: {
    exists: { errorMessage: "Email is required" },
    isEmail: { errorMessage: "Please provide valid email" },
  },
};

const userSignupValidateSchema = {
  password: {
    exists: { errorMessage: "Password is required" },
    isString: { errorMessage: "Password should be string" },
    isLength: {
      options: { min: 8 },
      errorMessage: "Password should be at least 8 characters",
    },
  },
  email: {
    exists: { errorMessage: "Email is required" },
    isEmail: { errorMessage: "Please provide valid email" },
  },
  phoneNumber: {
    exists: { errorMessage: "Phone number is required" },
    isString: { errorMessage: "Please provide valid phone number" },
  },
  displayName: {
    exists: { errorMessage: "Name is required" },
    isString: { errorMessage: "Please provide valid name" },
  },
};

module.exports = { userLoginValidateSchema, userSignupValidateSchema };
