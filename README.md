# README #

This README would normally document whatever steps are necessary to get your application up and running.

### What is this repository for? ###

* This repository focuses on implementing user authentication and login functionality, allowing users to log in using traditional methods (username/password) as well as social network accounts like Facebook, Google, Microsoft, and GitHub. It also includes features such as Two-Factor Authentication (TFA), enhancing security, and Attribute-Based Access Control (ABAC), providing fine-grained access control. Additionally, webhook registration enables real-time notifications for events.
* Version 1.0 .0

### Migrate database ###

* npx prisma generate
* npx prisma migrate dev

### Run application ###
* pnpm run start:dev