const API_ROOT = 'https://herocoders.atlassian.net/rest/api/3'
const PROJECT_ID = 'SP'

class ApiError extends Error {
    constructor(message, response) {
        super(message);
        this.response = response;
    }
}

const throwingFetch = async (input, init) => {
    const response = await fetch(input, init);
    if (!response.ok) {
        throw new ApiError('API call error', response)
    }
    return response;
}

const getComponents = async () => await throwingFetch(`${API_ROOT}/project/${PROJECT_ID}/components`)

const getIssueCount = async (componentId) => await throwingFetch(`${API_ROOT}/component/${componentId}/relatedIssueCounts`)


const main = async () => {
    const componentsResponse = await getComponents();
    const components = await componentsResponse.json();
    const componentsWithNoLead = components.filter(c => !c.lead);

    const componentWithIssueCountsPromises = componentsWithNoLead.map(component => {
        return getIssueCount(component.id).then(async (response) => {
            const issueCountData = await response.json();
            return {...component, issueCount: issueCountData.issueCount}
        })
    })

    componentWithIssueCountsPromises.forEach(componentPromise => {
        componentPromise.then((component) => console.log(component.name, component.issueCount));
    })

    // this needs batching for real-life situations
    await Promise.all(componentWithIssueCountsPromises);
}

(async () => {
    try {
        await main();
    } catch (e) {
        // enterprise grade error handling
        console.trace(e);
        process.exit(1)
    }
})();