[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/UxpU_KWG)
# Assignment 6

## Pre-requisites:
The following must be active:
* The MongoDB remote database for both the prod and dev environment. The function will post the question directly to the prod
database.

* Optionally, the prod and dev versions of the entire application. This is useful for seeing the question on the 
application itself.

## How to run:

1. Go to the `Actions` tab of the project repo. Screenshot for step 1 is shown below:
2. Click on the name of the workflow (in this case `Deploy Serverless Function`)
3. The workflow is run manually. In the `This workflow has a workflow _dispatch` event trigger,
select `Run workflow` drop-down and check that branch is `master`.
4. Click on `Run workflow button`. 

Screenshot below:
![Actions screenshot](./screenshots/workflow.png)

## Expected outputs:
Two functions will be deployed, one for posting the fetched question to Dev and the other that does the same thing
but for Prod.

For each function, there are 2 possible outputs:
1. Successfully posted. In this case, the ID of the question after it is posted to MongoDB is shown

2. Error 400 because the question has already been posted to MongoDB. The message is as follows:
`Question with same title of <question title> already exists: <question ID in MongoDB>`

## Caveat:
You will need collaborator access to this repository to do the above steps. Feel free to contact any of us to request
for this access if necessary.
