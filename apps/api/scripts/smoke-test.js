/**
 * Minimal API Smoke Test — MyFamily (Epic E01)
 *
 * Lightweight smoke test suite using Node.js built-in `node:test`
 * and `node:assert/strict` against the MyFamily REST API.
 *
 * Essential workflows covered:
 *   1. Register a new user with unique credentials
 *   2. Login with credentials
 *   3. Create a post
 *   4. Get feed and verify created post is present
 *   5. Like the post and verify like recorded
 *   6. Add comment and verify comment recorded
 *   7. Verify response structures and clean up all test-created resources
 */

const path = require('node:path');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/user.model');
const Post = require('../models/post.model');
const Like = require('../models/like.model');
const Comment = require('../models/comment.model');

const BASE_URL = process.env.TEST_API_URL || process.env.API_URL || 'http://localhost:3000';

/**
 * Extract user id from a JWT payload without mutating verification state.
 * Used as a fallback for cleanup if login fails after registration.
 */
function decodeJwtUserId(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return payload?.id || null;
    } catch {
        return null;
    }
}

describe('API Safety Net — Smoke Test Suite', () => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const testUsername = `smoke_${timestamp}_${randomSuffix}`;
    const testEmail = `${testUsername}@example.com`;
    const testPassword = 'Password123!';

    let registerAttempted = false;
    let authToken = null;
    let userId = null;
    let createdPostId = null;
    let createdCommentId = null;

    before(async () => {
        // Pre-flight check: ensure API server is reachable
        try {
            const res = await fetch(`${BASE_URL}/api/posts`);
            // Without token this should return 401
            assert.strictEqual(
                res.status,
                401,
                `Expected 401 for unauthenticated request, got ${res.status}`
            );
        } catch (err) {
            throw new Error(
                `API server at ${BASE_URL} is unreachable. Ensure the backend is running. Details: ${err.message}`
            );
        }
    });

    test('1. Register — User Registration with unique credentials', async () => {
        registerAttempted = true;
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUsername,
                email: testEmail,
                password: testPassword
            })
        });

        assert.strictEqual(res.status, 201, `Expected status 201, received ${res.status}`);
        const body = await res.json();
        assert.strictEqual(body.status, 'success', `Expected status "success", received ${body.status}`);
        assert.ok(body.data?.token, 'Response must contain auth token');
        authToken = body.data.token;
        userId = decodeJwtUserId(authToken);
    });

    test('2. Login — User Authentication', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        assert.strictEqual(res.status, 200, `Expected status 200, received ${res.status}`);
        const body = await res.json();
        assert.strictEqual(body.status, 'success', `Expected status "success", received ${body.status}`);
        assert.ok(body.data?.token, 'Login response must contain auth token');
        assert.ok(body.data?.idUser, 'Login response must contain idUser');

        authToken = body.data.token;
        userId = body.data.idUser;
    });

    test('3. Create Post — Submit new post', async () => {
        assert.ok(authToken, 'authToken required for post creation');
        assert.ok(userId, 'userId required for post creation');

        const postContent = `Smoke test post content at ${timestamp}`;
        const res = await fetch(`${BASE_URL}/api/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: postContent,
                userId: userId,
                username: testUsername
            })
        });

        assert.strictEqual(res.status, 201, `Expected status 201, received ${res.status}`);
        const body = await res.json();
        assert.strictEqual(body.status, 'success', `Expected status "success", received ${body.status}`);
        assert.ok(body.data?.post?._id, 'Created post must include _id');
        assert.strictEqual(body.data.post.content, postContent, 'Post content must match submitted text');
        assert.strictEqual(body.data.post.username, testUsername, 'Post username must match author');
        assert.strictEqual(body.data.post.userId, userId, 'Post userId must match author ID');

        createdPostId = body.data.post._id;
    });

    test('4. Get Feed — Retrieve posts and verify created post is present', async () => {
        assert.ok(authToken, 'authToken required to fetch feed');
        assert.ok(createdPostId, 'createdPostId required for feed verification');

        const res = await fetch(`${BASE_URL}/api/posts?limit=10&page=1`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        assert.strictEqual(res.status, 200, `Expected status 200, received ${res.status}`);
        const body = await res.json();
        assert.strictEqual(body.status, 'success', `Expected status "success", received ${body.status}`);
        assert.ok(Array.isArray(body.data?.posts), 'Expected posts to be an array');

        const foundPost = body.data.posts.find(p => p._id === createdPostId);
        assert.ok(foundPost, `Created post ID ${createdPostId} must be present in feed`);
        assert.strictEqual(foundPost.username, testUsername, 'Feed post username must match');
    });

    test('5. Like Post — Toggle like on created post', async () => {
        assert.ok(authToken, 'authToken required to like post');
        assert.ok(createdPostId, 'createdPostId required to like post');

        const res = await fetch(`${BASE_URL}/api/like/${createdPostId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                likeUserName: testUsername,
                postId: createdPostId
            })
        });

        assert.strictEqual(res.status, 200, `Expected status 200, received ${res.status}`);
        const body = await res.json();
        assert.strictEqual(body.status, 'success', `Expected status "success", received ${body.status}`);
        assert.ok(Array.isArray(body.data?.likesPost), 'Expected likesPost to be an array');
        assert.ok(
            body.data.likesPost.includes(testUsername),
            `likesPost array must include username "${testUsername}"`
        );
    });

    test('6. Add Comment — Create comment on created post', async () => {
        assert.ok(authToken, 'authToken required to add comment');
        assert.ok(createdPostId, 'createdPostId required to add comment');

        const commentText = `Smoke test comment at ${timestamp}`;
        const res = await fetch(`${BASE_URL}/api/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: commentText,
                userId: userId,
                username: testUsername,
                postId: createdPostId,
                avatar: '/uploads/profile.png'
            })
        });

        assert.strictEqual(res.status, 201, `Expected status 201, received ${res.status}`);
        const body = await res.json();
        assert.strictEqual(body.status, 'success', `Expected status "success", received ${body.status}`);
        assert.ok(body.data?.comment?._id, 'Comment must have an _id');
        assert.strictEqual(body.data.comment.content, commentText, 'Comment content must match');
        assert.strictEqual(body.data.comment.postId, createdPostId, 'Comment postId must match target post');

        createdCommentId = body.data.comment._id;
    });

    test('7. Verify Post, Like, and Comment in responses', async () => {
        assert.ok(createdPostId, 'createdPostId must be defined');

        // Fetch single post to verify updated likes and comment count
        const postRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        assert.strictEqual(postRes.status, 200, 'Expected single post fetch to return 200');
        const postBody = await postRes.json();
        assert.strictEqual(postBody.status, 'success');
        assert.strictEqual(postBody.data._id, createdPostId, 'Post ID must match');
        assert.ok(
            postBody.data.usernameLikes.includes(testUsername),
            'Post usernameLikes must contain test user'
        );
        assert.ok(
            postBody.data.lengthComments >= 1,
            'Post lengthComments must reflect added comment'
        );

        // Fetch comments for post
        const commentsRes = await fetch(`${BASE_URL}/api/comments/${createdPostId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        assert.strictEqual(commentsRes.status, 200, 'Expected comments fetch to return 200');
        const commentsBody = await commentsRes.json();
        assert.strictEqual(commentsBody.status, 'success');
        assert.ok(Array.isArray(commentsBody.data?.Comments), 'Comments must be an array');
        const foundComment = commentsBody.data.Comments.find(c => c._id === createdCommentId);
        assert.ok(foundComment, `Created comment ID ${createdCommentId} must be present`);
    });

    after(async () => {
        if (!registerAttempted) {
            return;
        }

        // First attempt API cleanup of the created post (cascades likes/comments via controller)
        if (createdPostId && authToken) {
            try {
                await fetch(`${BASE_URL}/api/posts/${createdPostId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
            } catch {
                // Fall through to guaranteed database cleanup below
            }
        }

        const mongoUrl = process.env.MONGO_URL;
        assert.ok(mongoUrl, 'MONGO_URL is required to clean up test user and associated test data');

        await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });
        try {
            const userFilter = userId
                ? { $or: [{ _id: userId }, { email: testEmail }] }
                : { email: testEmail };

            const testUser = await User.findOne(userFilter).select('_id');
            const targetUserId = userId || (testUser ? String(testUser._id) : null);

            const postOrConditions = [{ username: testUsername }];
            if (createdPostId) postOrConditions.push({ _id: createdPostId });
            if (targetUserId) postOrConditions.push({ userId: targetUserId });
            const postFilter = { $or: postOrConditions };

            const testPosts = await Post.find(postFilter).select('_id');
            const postIds = testPosts.map(p => String(p._id));
            if (createdPostId && !postIds.includes(createdPostId)) {
                postIds.push(createdPostId);
            }

            const commentOrConditions = [{ username: testUsername }];
            if (postIds.length > 0) commentOrConditions.push({ postId: { $in: postIds } });
            if (targetUserId) commentOrConditions.push({ userId: targetUserId });
            const commentFilter = { $or: commentOrConditions };

            const likeOrConditions = [{ likeUserName: testUsername }];
            if (postIds.length > 0) likeOrConditions.push({ postId: { $in: postIds } });
            const likeFilter = { $or: likeOrConditions };

            await Comment.deleteMany(commentFilter);
            await Like.deleteMany(likeFilter);
            await Post.deleteMany(postFilter);
            await User.deleteOne(userFilter);

            const [remainingUser, remainingPosts, remainingComments, remainingLikes] = await Promise.all([
                User.findOne(userFilter).select('_id'),
                Post.countDocuments(postFilter),
                Comment.countDocuments(commentFilter),
                Like.countDocuments(likeFilter)
            ]);

            assert.strictEqual(remainingUser, null, 'Test user must be removed after smoke test');
            assert.strictEqual(remainingPosts, 0, 'Test posts must be removed after smoke test');
            assert.strictEqual(remainingComments, 0, 'Test comments must be removed after smoke test');
            assert.strictEqual(remainingLikes, 0, 'Test likes must be removed after smoke test');
        } finally {
            await mongoose.disconnect();
        }
    });
});
