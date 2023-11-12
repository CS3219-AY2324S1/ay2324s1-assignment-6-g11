const { MongoClient, ServerApiVersion } = require("mongodb");
const functions = require('@google-cloud/functions-framework');

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql';
const DAILY_CODING_CHALLENGE_QUERY = `
query questionOfToday {
    activeDailyCodingChallengeQuestion {
        date
        link
        question {
            questionId
            questionFrontendId
            boundTopicId
            title
            titleSlug
            content
            translatedTitle
            translatedContent
            isPaidOnly
            difficulty
            likes
            dislikes
            isLiked
            similarQuestions
            exampleTestcases
            contributors {
                username
                profileUrl
                avatarUrl
            }
            topicTags {
                name
                slug
                translatedName
            }
            companyTagStats
            codeSnippets {
                lang
                langSlug
                code
            }
            stats
            hints
            solution {
                id
                canSeeDetail
                paidOnly
                hasVideoSolution
                paidOnlyVideo
            }
            status
            sampleTestCase
            metaData
            judgerAvailable
            judgeType
            mysqlSchemas
            enableRunCode
            enableTestMode
            enableDebugger
            envInfo
            libraryUrl
            adminUrl
            challengeQuestion {
                id
                date
                incompleteChallengeCount
                streakCount
                type
            }
            note
        }
    }
}`;

const uri = process.env.MONGO_ATLAS_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const mongoClient = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		deprecationErrors: true,
	},
});

functions.http('httpHandler', async (req, res) => {
	const handlerResponse = await handler();
	res.status(handlerResponse.statusCode).send(handlerResponse.body);
})

functions.cloudEvent('cloudEventHandler', async (cloudEvent) => {
	await handler();
})

const handler = async () => {
	let responseData;

	try {
		const response = await fetch(`${LEETCODE_API_ENDPOINT}?query=${encodedChallengeQuery}`, {
			method: 'GET'
		});

		responseData = await response.json();
		const question = responseData["data"]["activeDailyCodingChallengeQuestion"]["question"]

		let difficulty = question.difficulty.toLowerCase();
		let title = question.title;
		let content = question.content;

		let dateCreated = new Date();
		let dateUpdated = new Date();
		let author = 'ExtractedFromLeetCode'

		try {
			let db = mongoClient.db("question_db");
			let collection = db.collection("questions");
			// Find question with same title
			let same_title_qn = await collection.findOne({ title: title });
			if (same_title_qn) {
				return {
					statusCode: 400,
					body: JSON.stringify({message: "Question with same title already exists: " + same_title_qn._id})
				};
			}

			/*
				Test cases are lumped together like this:
				'[[1,2,7],[3,6,7]]\n1\n6\n[[7,12],[4,5,15],[6],[15,19],[9,12,13]]\n15\n12'

				The above is actually 2 cases in a single string for one question. Additionally, I'm not sure about
				how each test case is formatted in other questions.

				So test cases will be left blank for now.

				No solutions are available for now either
     	*/
			let result = await collection.insertOne({
				title: title,
				content: content,
				difficulty: difficulty,
				dateCreated: dateCreated,
				dateUpdated: dateUpdated,
				topics: question.topicTags?.map((topic) => topic.name),
				testCasesInputs: [],
				testCasesOutputs: [],
				defaultCode: question.codeSnippets?.find((snippet) => snippet.lang === "python")?.code,
				solution: {},
				author: author
			});
			if (!result.acknowledged) {
				return {
					statusCode: 500,
					body: JSON.stringify({message: "Failed to insert question"})
				};
			}
			return {
				statusCode: 201,
				body: JSON.stringify(result.insertedId)
			};

		} catch (error) {
			console.error(`Error: ${error}`);
			return {
				statusCode: 500,
				body: JSON.stringify({ message: 'Failed to post the daily question' }),
			};
		}
	} catch (error) {
		console.error(`Error: ${error}`);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Failed to fetch the daily question' }),
		};
	}
};
