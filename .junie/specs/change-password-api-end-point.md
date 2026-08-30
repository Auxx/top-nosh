# Change Password API End Point

Add a new end-point to `AuthController` inside `api` project.

## API End Point Requirements

- Endpoint should only be accessible to authenticated users.
- Endpoint should accept `password` field in the request body.
- Endpoint should update the hash of the user's password in the database.
- Password should be hashed using argon2.
- Endpoint should throw an error if the password is not changed successfully.
- Endpoint should return a success response if the password is changed successfully.
- Endpoint path should be `/api/auth/change-password` and it should be a `POST` request.
