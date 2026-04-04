import AppError from '../utils/appError.js';

const uiTheme = {
    name: 'Midnight Graph',
    mode: 'dark',
    palette: {
        background: '#08111f',
        surface: '#111a2e',
        surfaceAlt: '#16233d',
        primary: '#7c9cff',
        secondary: '#6be7c8',
        text: '#e8eefc',
        muted: '#9bb0d0',
        border: '#243354',
    },
    layout: 'card-grid',
};

const implementationProcess = {
    prerequisites: [
        'Node.js 18+ and npm installed',
        'Working Express server with controller/service pattern',
        'One LLM provider key (for example OpenAI)',
    ],
    installCommands: [
        'npm i langchain @langchain/openai @langchain/langgraph dotenv',
    ],
    envSetup: [
        'Add OPENAI_API_KEY in your .env file',
        'Load environment variables once in server bootstrap',
        'Never hardcode API keys inside services',
    ],
    folderIntegration: [
        'Create src/services/gen-ai-single-agent.service.js for single-agent flow',
        'Create src/services/gen-ai-langgraph.service.js for graph orchestration flow',
        'Use existing src/controllers/gen-ai-implementation.controller.js to call service methods',
        'Expose POST endpoints from src/routes/gen-ai-implementation.routes.js for runnable demos',
        'Keep GET /api/v1/gen-ai-implementation as a documentation/guide endpoint',
    ],
    validationAndSafety: [
        'Validate question input before calling model',
        'Use short system prompts with clear output format',
        'Add request timeout and retry policy at service layer',
        'Log only request metadata, do not log secrets',
    ],
    rolloutPlan: [
        'Phase 1: Ship single-agent first',
        'Phase 2: Add specialist agents for research/writer split',
        'Phase 3: Move to LangGraph for branching, retries, and checkpoints',
    ],
};

const implementationModes = {
    single: {
        slug: 'single',
        title: 'Single-Agent LangChain',
        summary:
            'Use one orchestrator when the task has a clear path, a limited toolset, and predictable handoffs.',
        whenToUse: [
            'FAQ answering and support automation',
            'Simple retrieval augmented generation flows',
            'One model plus a few tools or retrievers',
        ],
        architecture: [
            'User request enters one agent loop',
            'Agent selects tools or retrievers',
            'Model synthesizes the final answer',
            'Response is formatted for the client UI',
        ],
        implementationSteps: [
            'Install LangChain core packages and choose a model provider.',
            'Define a system prompt with the expected output format.',
            'Attach tools for search, database lookup, or API calls.',
            'Wrap the agent in a service method and expose it through a controller.',
            'Return structured JSON so the frontend can render cards, steps, and code snippets.',
        ],
        processFlow: [
            'Receive user question in controller',
            'Validate and sanitize input',
            'Build prompt template and invoke one LLM',
            'Return final structured answer',
        ],
        codeSnippet: `import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.2,
});

const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a helpful assistant. Keep answer beginner-friendly.'],
    ['human', '{question}'],
]);

const chain = prompt.pipe(model).pipe(new StringOutputParser());

export async function runSingleAgent(question) {
    if (!question || !question.trim()) {
        throw new Error('Question is required');
    }

    const answer = await chain.invoke({ question });
    return {
        mode: 'single-agent',
        question,
        answer,
    };
}`,
        tradeoffs: [
            'Fast to build and easy to debug',
            'Can become brittle if the workflow grows too complex',
            'Best for linear workflows',
        ],
    },
    multi: {
        slug: 'multi',
        title: 'Multi-Agent LangChain',
        summary:
            'Use multiple specialized agents when the task needs role separation, parallel work, or explicit delegation.',
        whenToUse: [
            'Research, planning, and content generation pipelines',
            'Tasks where one agent should review another agent’s output',
            'Workflows that benefit from a supervisor or router agent',
        ],
        architecture: [
            'A supervisor receives the task and chooses the next specialist',
            'Specialist agents handle narrow responsibilities',
            'Agents return intermediate outputs to the supervisor',
            'Supervisor merges the final response for the client',
        ],
        implementationSteps: [
            'Define a shared task schema so every agent returns the same shape.',
            'Create specialist agents for research, drafting, and validation.',
            'Add a supervisor agent that routes based on task context.',
            'Persist conversation state so the agents can share progress.',
            'Keep outputs deterministic and expose trace metadata in the API response.',
        ],
        processFlow: [
            'Supervisor receives user goal',
            'Supervisor chooses specialist agent',
            'Specialist returns intermediate output',
            'Supervisor combines and returns final answer',
        ],
        codeSnippet: `import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.3 });

async function researchAgent(task) {
    const prompt = 'Research this topic in concise points: ' + task;
    const response = await llm.invoke(prompt);
    return response.content;
}

async function writerAgent(task, researchNotes) {
    const prompt = [
        'Task: ' + task,
        'Notes: ' + researchNotes,
        'Write a clean beginner-friendly response.',
    ].join('\n');
    const response = await llm.invoke(prompt);
    return response.content;
}

export async function runMultiAgent(task) {
    if (!task || !task.trim()) {
        throw new Error('Task is required');
    }

    const notes = await researchAgent(task);
    const finalAnswer = await writerAgent(task, notes);

    return {
        mode: 'multi-agent',
        task,
        notes,
        finalAnswer,
    };
}`,
        tradeoffs: [
            'More flexible than a single-agent flow',
            'Requires stronger state management and tracing',
            'Useful when tasks can be decomposed into clear roles',
        ],
    },
    langgraph: {
        slug: 'langgraph',
        title: 'LangGraph Orchestration',
        summary:
            'Use LangGraph when you need explicit graph-based control, branching, retries, or stateful loops.',
        whenToUse: [
            'Complex workflows with conditional routing',
            'Multi-step systems that need retries or checkpoints',
            'Agent workflows that must pause, resume, or branch',
        ],
        architecture: [
            'Model the workflow as nodes and edges',
            'Store shared state in a graph state object',
            'Route between nodes based on state conditions',
            'Compile the graph and execute it like a reusable pipeline',
        ],
        implementationSteps: [
            'Design a state schema for messages, tasks, and final output.',
            'Create nodes for planning, tool use, validation, and response formatting.',
            'Add conditional edges for branching logic and fallback paths.',
            'Compile the graph once and reuse it from your service layer.',
            'Expose the graph result through your API so the UI can visualize the path taken.',
        ],
        processFlow: [
            'Define graph state object and defaults',
            'Run planner node to generate plan',
            'Run execution node to produce draft output',
            'Route to validator and decide finish/retry',
            'Return final answer with traceable state fields',
        ],
        codeSnippet: `import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, END } from '@langchain/langgraph';

const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.2 });

async function plannerNode(state) {
    const res = await llm.invoke('Create a 3-step plan for: ' + state.question);
    return { ...state, plan: res.content };
}

async function executorNode(state) {
    const res = await llm.invoke(
        'Question: ' + state.question + '\nPlan: ' + state.plan + '\nGenerate draft answer.'
    );
    return { ...state, draft: res.content };
}

async function validatorNode(state) {
    const res = await llm.invoke('Validate this draft and improve it: ' + state.draft);
    return { ...state, finalAnswer: res.content };
}

export async function runLangGraph(question) {
    const initialState = { question, plan: '', draft: '', finalAnswer: '' };

    const graph = new StateGraph({
        channels: { question: null, plan: null, draft: null, finalAnswer: null },
    })
        .addNode('planner', plannerNode)
        .addNode('executor', executorNode)
        .addNode('validator', validatorNode)
        .setEntryPoint('planner')
        .addEdge('planner', 'executor')
        .addEdge('executor', 'validator')
        .addEdge('validator', END);

    const app = graph.compile();
    const result = await app.invoke(initialState);

    return {
        mode: 'langgraph',
        question: result.question,
        plan: result.plan,
        answer: result.finalAnswer,
    };
}`,
        tradeoffs: [
            'Best control for complex workflows',
            'More setup than a single-agent implementation',
            'Excellent for production systems that need observability',
        ],
    },
};

const comparisonRows = [
    {
        label: 'Complexity',
        single: 'Low',
        multi: 'Medium',
        langgraph: 'High',
    },
    {
        label: 'Best for',
        single: 'Linear tasks',
        multi: 'Delegated work',
        langgraph: 'Stateful workflows',
    },
    {
        label: 'Control',
        single: 'Simple prompt loop',
        multi: 'Supervisor routing',
        langgraph: 'Explicit node routing',
    },
    {
        label: 'Observability',
        single: 'Basic traces',
        multi: 'Per-agent traces',
        langgraph: 'Strong graph-level tracing',
    },
];

class GenAiImplementationService {
    validateQuestion(question) {
        const normalizedQuestion = `${question || ''}`.trim();

        if (!normalizedQuestion) {
            throw new AppError('Question is required.', 400);
        }

        if (normalizedQuestion.length > 2000) {
            throw new AppError('Question is too long. Keep it under 2000 characters.', 400);
        }

        return normalizedQuestion;
    }

    buildOverview() {
        return {
            title: 'GenAI implementation blueprint',
            subtitle:
                'Pick the simplest architecture that fits the workflow, then scale into multi-agent or LangGraph only when the task demands it.',
            recommendedPath: [
                'Start with a single-agent LangChain flow.',
                'Split into specialist agents if the workflow needs delegation.',
                'Move to LangGraph when routing, retries, or state checkpoints are required.',
            ],
        };
    }

    buildFeatureMetadata() {
        return {
            name: 'gen-ai-implementation',
            title: 'GenAI Implementation',
            description:
                'A structured guide for implementing single-agent, multi-agent, and LangGraph flows with LangChain.',
            status: 'public',
        };
    }

    buildImplementationProcess() {
        return implementationProcess;
    }

    buildAllImplementationModes() {
        return {
            single: implementationModes.single,
            multi: implementationModes.multi,
            langgraph: implementationModes.langgraph,
        };
    }

    runSingleAgentDemo(question) {
        const normalizedQuestion = this.validateQuestion(question);

        return {
            mode: 'single',
            question: normalizedQuestion,
            stages: [
                'Input validated',
                'Single prompt prepared',
                'One assistant response generated',
            ],
            response:
                `Single-agent demo response for: "${normalizedQuestion}". ` +
                'Use this mode when your workflow is linear and you need a fast first implementation.',
            nextStep:
                'If output quality is unstable, improve system prompt and add strict response format.',
        };
    }

    runMultiAgentDemo(question) {
        const normalizedQuestion = this.validateQuestion(question);

        const researchNotes = [
            'Identify key terms from user question',
            'Gather concise factual points',
            'Prepare summary notes for writer agent',
        ];

        return {
            mode: 'multi',
            question: normalizedQuestion,
            supervisorDecision: 'Route task to research agent then writer agent',
            researchNotes,
            writerOutput:
                `Multi-agent demo response for: "${normalizedQuestion}". ` +
                'Research notes were transformed into a beginner-friendly final answer.',
            nextStep:
                'Add evaluator/reviewer agent if you want quality checks before final response.',
        };
    }

    runLangGraphDemo(question) {
        const normalizedQuestion = this.validateQuestion(question);

        const graphTrace = [
            { from: 'START', to: 'planner' },
            { from: 'planner', to: 'executor' },
            { from: 'executor', to: 'validator' },
            { from: 'validator', to: 'END' },
        ];

        return {
            mode: 'langgraph',
            question: normalizedQuestion,
            state: {
                plan: 'Create a short step-by-step execution plan',
                draft: 'Generate initial answer from plan and context',
                finalAnswer:
                    `LangGraph demo response for: "${normalizedQuestion}" with planner -> executor -> validator pipeline.`,
            },
            graphTrace,
            nextStep:
                'Add conditional edge from validator to executor when confidence is low.',
        };
    }

    buildGuide(mode) {
        const normalizedMode = `${mode || 'all'}`.toLowerCase().trim();

        if (normalizedMode === 'all') {
            return {
                feature: this.buildFeatureMetadata(),
                uiTheme,
                overview: this.buildOverview(),
                process: this.buildImplementationProcess(),
                implementationModes: this.buildAllImplementationModes(),
                comparison: comparisonRows,
            };
        }

        const implementation = implementationModes[normalizedMode];
        if (!implementation) {
            throw new AppError(
                'Invalid mode. Use single, multi, langgraph, or all.',
                400
            );
        }

        return {
            feature: this.buildFeatureMetadata(),
            uiTheme,
            overview: this.buildOverview(),
            process: this.buildImplementationProcess(),
            implementation,
            comparison: comparisonRows,
        };
    }
}

export default new GenAiImplementationService();