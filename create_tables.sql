-- Create poll questions table
CREATE TABLE IF NOT EXISTS poll_questions (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id),
  text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  parent_id INTEGER REFERENCES poll_questions(id),
  parent_answer_id INTEGER,
  required BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create poll answers table
CREATE TABLE IF NOT EXISTS poll_answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES poll_questions(id),
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Create poll user responses table
CREATE TABLE IF NOT EXISTS poll_user_responses (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id),
  question_id INTEGER NOT NULL REFERENCES poll_questions(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  answer_id INTEGER REFERENCES poll_answers(id),
  answer_value JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign key on poll_questions.parent_answer_id after poll_answers is created
ALTER TABLE poll_questions 
ADD CONSTRAINT fk_poll_questions_parent_answer_id 
FOREIGN KEY (parent_answer_id) REFERENCES poll_answers(id);