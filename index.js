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

functions.http('httpHandler', (req, res) => {
	handler().then((internalResponse) => {
		res.status(internalResponse.statusCode).send(internalResponse.body);
	});
})

functions.cloudEvent('cloudEventHandler', cloudEvent => {
	handler().then(() => {});
})

const handler = async () => {
	let responseData;

	try {
		const response = await fetch(LEETCODE_API_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: DAILY_CODING_CHALLENGE_QUERY }),
		});

		console.log(response.json());
		responseData = response.json();

		try {
			let db = mongoClient.db("question_db");
			let collection = db.collection<Question>("questions");
			// Find question with same title
			let same_title_qn = await collection.findOne({ title: responseData.title });
			if (same_title_qn) {
				return {
					statusCode: 400,
					body: JSON.stringify({message: "Question with same title already exists: " + same_title_qn._id})
				};
			}

			let result = await collection.insertOne({
				title: responseData.title,
				content: responseData.content,
				difficulty: responseData.difficulty,
				dateCreated: new Date(),
				dateUpdated: new Date(),
				topics: responseData.topicTags?.map((topic) => topic.name),
				testCasesInputs: responseData.exampleTestcases,
				testCasesOutputs: [],
				defaultCode: responseData.codeSnippets?.find((snippet) => snippet.lang === "python")?.code,
				solution: responseData.solution ?? {},
				author: 'Extracted from LeetCode'
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
