-- Sample data for testing the admin panel
-- This would be converted to MongoDB insertions in a real application

-- Sample Users
INSERT INTO users (uid, email, name, gender, provider, emailVerified, onboardingComplete) VALUES
('user1', 'john.doe@example.com', 'John Doe', 'male', 'email', true, true),
('user2', 'jane.smith@example.com', 'Jane Smith', 'female', 'google', true, false),
('user3', 'bob.johnson@example.com', 'Bob Johnson', 'male', 'email', false, false);

-- Sample Family Trees
INSERT INTO family_trees (name, description, userId, isPublic) VALUES
('The Doe Family', 'Our family history dating back to 1800s', 'user1_id', true),
('Smith Lineage', 'Tracing the Smith family roots', 'user2_id', false);

-- Sample Members
INSERT INTO members (name, gender, birthDate, treeId) VALUES
('John Doe Sr.', 'male', '1950-01-15', 'tree1_id'),
('Mary Doe', 'female', '1952-03-20', 'tree1_id'),
('John Doe Jr.', 'male', '1975-07-10', 'tree1_id');

-- Sample Relationships
INSERT INTO relationships (sourceMember, targetMember, relationshipType, treeId) VALUES
('member1_id', 'member3_id', 'parent', 'tree1_id'),
('member2_id', 'member3_id', 'parent', 'tree1_id');
