/**
 * Ballot Service Client
 * 
 * HTTP client for communicating with the Python ballot validation service.
 * This service validates Gov.gr Solemn Declaration PDFs as certified ballots.
 */

const BALLOT_SERVICE_URL = process.env.BALLOT_SERVICE_URL || 'http://localhost:8001';

export interface BallotValidationResult {
    success: boolean;
    message: string;
    rejection_reason?: string;
    vote_choice?: string;
    signer_name?: string;
    voter_hash?: string;
    file_hash?: string;
}

export interface BallotInstructions {
    link: string;
    template_text: string;
    poll_token: string;
}

export interface PollTokenResponse {
    poll_id: string;
    poll_token: string;
    expires_at: string;
}

export interface BallotStats {
    poll_id: string;
    total_votes: number;
    choices: Record<string, number>;
}

/**
 * Check if the ballot service is healthy
 */
export async function checkBallotServiceHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${BALLOT_SERVICE_URL}/api/ballot/health`);
        return response.ok;
    } catch (error) {
        console.error('Ballot service health check failed:', error);
        return false;
    }
}

/**
 * Generate a poll token for ballot voting
 */
export async function generatePollToken(pollId: string): Promise<PollTokenResponse | null> {
    try {
        const response = await fetch(`${BALLOT_SERVICE_URL}/api/ballot/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ poll_id: pollId }),
        });

        if (!response.ok) {
            console.error('Failed to generate poll token:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error generating poll token:', error);
        return null;
    }
}

/**
 * Get voting instructions for a poll
 */
export async function getBallotInstructions(
    pollId: string,
    pollToken: string
): Promise<BallotInstructions | null> {
    try {
        const params = new URLSearchParams({ poll_id: pollId, poll_token: pollToken });
        const response = await fetch(`${BALLOT_SERVICE_URL}/api/ballot/instructions?${params}`);

        if (!response.ok) {
            console.error('Failed to get ballot instructions:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting ballot instructions:', error);
        return null;
    }
}

/**
 * Validate an uploaded ballot PDF
 */
export async function validateBallot(
    pdfBuffer: Buffer,
    pollId: string,
    pollToken: string,
    filename: string
): Promise<BallotValidationResult> {
    try {
        // Use FormData from form-data package for Node.js
        const FormData = (await import('form-data')).default;
        const formData = new FormData();

        // Append file with proper metadata
        formData.append('file', pdfBuffer, {
            filename: filename || 'ballot.pdf',
            contentType: 'application/pdf',
        });
        formData.append('poll_id', pollId);
        formData.append('poll_token', pollToken);

        // Use node-fetch style request with formData
        const http = await import('http');

        return new Promise((resolve) => {
            const url = new URL(`${BALLOT_SERVICE_URL}/api/ballot/validate`);

            const options = {
                hostname: url.hostname,
                port: url.port || 8001,
                path: url.pathname,
                method: 'POST',
                headers: formData.getHeaders(),
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);

                        if (res.statusCode && res.statusCode >= 400) {
                            // Handle error response from Python service
                            if (result.detail) {
                                resolve(typeof result.detail === 'object'
                                    ? result.detail
                                    : { success: false, message: result.detail });
                            } else {
                                resolve({ success: false, message: result.message || 'Validation failed' });
                            }
                        } else {
                            resolve(result);
                        }
                    } catch (e) {
                        resolve({
                            success: false,
                            message: `Failed to parse response: ${data.substring(0, 100)}`,
                        });
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Error validating ballot:', error);
                resolve({
                    success: false,
                    message: `Service error: ${error.message}`,
                });
            });

            // Pipe the form data to the request
            formData.pipe(req);
        });
    } catch (error) {
        console.error('Error validating ballot:', error);
        return {
            success: false,
            message: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Verify identity using Gov.gr PDF (One-Time Verification)
 */
export async function verifyIdentity(
    pdfBuffer: Buffer,
    filename: string
): Promise<BallotValidationResult> {
    try {
        const FormData = (await import('form-data')).default;
        const formData = new FormData();

        formData.append('file', pdfBuffer, {
            filename: filename || 'identity.pdf',
            contentType: 'application/pdf',
        });

        const http = await import('http');

        return new Promise((resolve) => {
            const url = new URL(`${BALLOT_SERVICE_URL}/api/ballot/verify-identity`);

            const options = {
                hostname: url.hostname,
                port: url.port || 8001,
                path: url.pathname,
                method: 'POST',
                headers: formData.getHeaders(),
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (res.statusCode && res.statusCode >= 400) {
                            if (result.detail) {
                                resolve(typeof result.detail === 'object' ? result.detail : { success: false, message: result.detail });
                            } else {
                                resolve({ success: false, message: result.message || 'Verification failed' });
                            }
                        } else {
                            resolve(result);
                        }
                    } catch (e) {
                        resolve({ success: false, message: 'Failed to parse response' });
                    }
                });
            });

            req.on('error', (err) => resolve({ success: false, message: err.message }));
            formData.pipe(req);
        });
    } catch (error) {
        return { success: false, message: `Service error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
}

/**
 * Get ballot voting statistics for a poll
 */
export async function getBallotStats(pollId: string): Promise<BallotStats | null> {
    try {
        const response = await fetch(`${BALLOT_SERVICE_URL}/api/ballot/stats?poll_id=${pollId}`);

        if (!response.ok) {
            console.error('Failed to get ballot stats:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting ballot stats:', error);
        return null;
    }
}
