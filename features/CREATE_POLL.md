# Create Poll Feature

This document outlines the implementation of the Create Poll feature in the Pickly application.

## Overview

The Create Poll feature allows users to create new polls with the following capabilities:

- Basic poll information (title, description)
- Configurable expiration date
- Multiple poll options with text, emoji, and image support
- Public/private poll visibility
- Participant management for private polls
- Anonymous voting options

## Components

### `CreatePollForm`

The main component that handles the poll creation form. It manages the form state and user interactions.

### `PollOption`

A type definition representing a poll option with text, emoji, and optional image.

### `Participant`

A type definition representing a participant in a private poll.

## Features

### 1. Poll Basics
- Title (required)
- Description (optional)
- Expiration date (required, defaults to 7 days from now)

### 2. Poll Options
- Add/remove multiple options
- Each option supports:
  - Text label (required)
  - Optional emoji
  - Optional image upload (client-side only)
- Minimum of 2 options required

### 3. Visibility & Privacy
- Public/private toggle
- For private polls:
  - Add/remove participants by email or username
  - Anonymous voting option

## Technical Details

- Built with React and TypeScript
- Uses Tailwind CSS for styling
- Client-side form validation
- Responsive design for all screen sizes
- No backend integration (yet)

## Future Improvements

1. Backend integration for saving polls
2. Real-time validation
3. Image upload to a storage service
4. Email notifications for invited participants
5. Copy to clipboard for shareable links
