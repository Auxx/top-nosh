# Project Configuration Management

Top Nosh needs a way to store, modify, and retrieve its configuration from the database. Configuration management functionality should be available to both backend and frontend.

## Configuration Management Service requirements

Create a service in `api` project which will be responsible for configuration management together with required tables and migrations to support its functionality. 

- Configuration should be stored as key value pairs.
- Each value is a string field without length limitation - the values will be validated by other parts of the application and might contain long JSON data.
- Each value can be `null`.
- Each key should be composed from three parts: `domain`, `group`, and `entity`. They should be one string field in the database.
- The key name should be all three parts joined by a dot. For example `files.storage.type`.
- Each key name should be unique.
- The table should follow best practices and include an auto-generated id, created at and updated at fields as it is done with other tables and models in the project.
- Once a key is added it cannot be removed from the database, but its value can be set to `null`.
- Add a set of methods to create and update configuration keys. If the key does not exist, the update method should insert it.
- If a key does not exist - return `null` instead.
- It should be possible to access keys either by full name as a single string like `files.storage.type`, or by providing three separate string arguments `domain`, `group`, and `entity`.
- There should be a method to query all keys and their values by `domain`.
- There should be a method to query all keys and their values by `domain` and `group`.
- Keys with `null` values should be removed from key lists.

## Configuration Management Controller requirements

The frontend application should be able to retrieve and update configuration. Create a controller which exposes Configuration Management Service functionality to the frontend. 

- New controller must require valid authentication for all endpoints.
- An endpoint to retrieve a specific key value should accept an array of keys to reduce the amount of HTTP calls the frontend has to make. It should respond with a JSON object which maps each requested key to a value. Non existent keys should be mapped to `null`.
- An endpoint to modify a key value should accept a JSON object which maps multiple keys to values to reduce the amount of HTTP calls the frontend has to make.
