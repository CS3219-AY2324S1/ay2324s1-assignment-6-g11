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

export const handler = async (event) => {
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
			const url = `https://api.codeparty.org/question`;

			const response = await fetch(url, {
				method: "POST",
				mode: "cors",
				body: JSON.stringify({
					title: responseData.title,
					difficulty: responseData.difficulty,
					topics: responseData.topicTags?.map((topic) => topic.name),
					content: responseData.content,
					testCasesInputs: responseData.exampleTestcases,
					testCasesOutputs: [],
					defaultCode: responseData.codeSnippets?.find((snippet) => snippet.lang === "python")?.code,
				}),
				headers: {
					"Content-Type": "application/json",
					"User-Id-Token": "leetcode",
				},
			});

			if (!response.ok) {
				console.error(`Error: ${response.status}`);
				return {
					statusCode: 500,
					body: JSON.stringify({ message: 'Failed to post the daily question' }),
				};
			}
			return {
				statusCode: 200,
				body: JSON.stringify({ message: 'Successfully posted the daily question' }),
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
