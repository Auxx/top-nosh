# Project Configuration Management

Top Nosh needs a way to store, modify, and retrieve its configuration from the database. Configuration management functionality should be available to both backend and frontend.

## Configuration Management Service requirements

Create a service which will be responsible for configuration management together with required tables and migrations to support its functionality. 

- Configuration should be stored as key value pairs.
- Each value is a string field without length limitation - the values will be validated by other parts of the application and might contain long JSON data.
- Each value can be `null`.
- Each key should be composed from three parts: `domain`, `group`, and `entity`. They should be one string field in the database.
- The key name should be all three parts joined by a dot. For example `files.storage.type`.
- Each key name should be unique.
