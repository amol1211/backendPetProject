import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1.get user details from frontend
  // 2.validation - not empty
  // 3.check if user already exists: username, email
  // 4.check for images, check for avatar
  // 5.upload them to cloudinary, avatar
  // 6.create user object - create entry in db
  // 7.remove password and refresh token field from response
  // 8.check for user creation
  // 9.return res

  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  /* if (fullName === "") {
    throw new apiError(400, "fullname is required"); 
  } */
  /* It is very lengthy task to handle every required field with if else condition, hence we use single array consisting of every field with .some method which Determines whether the specified callback function returns true for any element of an array.*/

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
    /*
    1. .some() Method:
    The .some() method is used on the array. It tests whether at least one element in the array passes the provided function (a callback function).

    2. Callback Function (field) => field?.trim() === "":
    This is the function being run on each item in the array.
  field?.trim() does two things:
    field? is optional chaining, which ensures that field is not undefined or null before trying to access its methods. If field is null or undefined, the whole expression will safely return undefined without causing an error.

  .trim() removes any leading or trailing whitespace characters from field.

   The function checks if the trimmed value of field is an empty string (""), which would mean the field is either empty or consists only of whitespace.

   The if Statement:

   If any of the fields (fullName, email, username, password) is empty or contains only whitespace (as determined by the .some() function), the condition inside the if statement becomes true, and the block of code within the if will execute.*/
  ) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(
      409,
      "User with entered email or username already exists"
    );
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalImage = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalImage);

  if (!avatar) {
    throw new apiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered successfully!"));
});

export { registerUser };
