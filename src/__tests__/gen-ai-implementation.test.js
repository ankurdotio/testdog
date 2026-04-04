import request from 'supertest';
import app from '../app.js';

describe('GenAI Implementation API Routes', () => {
    describe('GET /api/v1/gen-ai-implementation', () => {
        it('should return the full implementation guide by default', async () => {
            const response = await request(app)
                .get('/api/v1/gen-ai-implementation')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                'GenAI implementation guide retrieved successfully'
            );
            expect(response.body.data).toHaveProperty('feature');
            expect(response.body.data).toHaveProperty('uiTheme');
            expect(response.body.data).toHaveProperty('overview');
            expect(response.body.data).toHaveProperty('implementationModes');
            expect(response.body.data.implementationModes).toHaveProperty('single');
            expect(response.body.data.implementationModes).toHaveProperty('multi');
            expect(response.body.data.implementationModes).toHaveProperty(
                'langgraph'
            );
        });

        it('should return a single-agent guide when requested', async () => {
            const response = await request(app)
                .get('/api/v1/gen-ai-implementation?mode=single')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.implementation.slug).toBe('single');
            expect(response.body.data.implementation.title).toBe(
                'Single-Agent LangChain'
            );
        });

        it('should return a LangGraph guide when requested', async () => {
            const response = await request(app)
                .get('/api/v1/gen-ai-implementation?mode=langgraph')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.implementation.slug).toBe('langgraph');
            expect(response.body.data.implementation.codeSnippet).toContain(
                'StateGraph'
            );
        });

        it('should return 400 for invalid mode values', async () => {
            const response = await request(app)
                .get('/api/v1/gen-ai-implementation?mode=unknown')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(
                'Invalid mode. Use single, multi, langgraph, or all.'
            );
        });
    });

    describe('POST /api/v1/gen-ai-implementation/*/ask', () => {
        it('should return single-agent demo output', async () => {
            const response = await request(app)
                .post('/api/v1/gen-ai-implementation/single/ask')
                .send({ question: 'How to start with LangChain?' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                'Single-agent demo response generated successfully'
            );
            expect(response.body.data.mode).toBe('single');
            expect(response.body.data).toHaveProperty('response');
        });

        it('should return multi-agent demo output', async () => {
            const response = await request(app)
                .post('/api/v1/gen-ai-implementation/multi/ask')
                .send({ question: 'How to design multi-agent pipeline?' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                'Multi-agent demo response generated successfully'
            );
            expect(response.body.data.mode).toBe('multi');
            expect(response.body.data).toHaveProperty('researchNotes');
        });

        it('should return langgraph demo output', async () => {
            const response = await request(app)
                .post('/api/v1/gen-ai-implementation/langgraph/ask')
                .send({ question: 'How to add retries in workflow?' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                'LangGraph demo response generated successfully'
            );
            expect(response.body.data.mode).toBe('langgraph');
            expect(response.body.data).toHaveProperty('graphTrace');
        });

        it('should return 400 when question is missing', async () => {
            const response = await request(app)
                .post('/api/v1/gen-ai-implementation/single/ask')
                .send({ question: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Question is required.');
        });
    });
});