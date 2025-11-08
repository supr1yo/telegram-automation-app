# API Routes and Environment Variables

This document provides a comprehensive overview of all the API routes and their corresponding environment variables.

## Outreach

The Outreach service is responsible for handling outreach-related functionalities.

- **API URL:** `VITE_OUTREACH_API_URL`
  - **Default Value:** `http://localhost:8012`
  - **Description:** This variable stores the base URL for the Outreach API.

- **Workflow Start URL:** `VITE_WORKFLOW_START_URL`
  - **Default Value:** `http://localhost:5678/webhook/start-workflow-data`
  - **Description:** This variable holds the URL to initiate a workflow.

## Keyword Monitor

The Keyword Monitor service is used to track and monitor specific keywords.

- **API URL:** `VITE_KEYWORD_MONITOR_API_URL`
  - **Default Value:** `http://localhost:8013`
  - **Description:** This variable contains the base URL for the Keyword Monitor API.

## Keyword Search

The Keyword Search service provides functionality to search for keywords.

- **API URL:** `VITE_KEYWORD_SEARCH_API_URL`
  - **Default Value:** `http://127.0.0.1:5001`
  - **Description:** This variable stores the base URL for the Keyword Search API.

## Export Group Members

This service is used for exporting members of a group.

- **API URL:** `VITE_EXPORT_GROUP_MEMBERS_API_URL`
  - **Default Value:** `http://localhost:8011`
  - **Description:** This variable holds the base URL for the Export Group Members API.

## Telegram Account Sessions

The Telegram Account Sessions service manages user sessions for Telegram accounts.

- **API URL:** `VITE_TELEGRAM_ACCOUNT_SESSIONS_API_URL`
  - **Default Value:** `http://127.0.0.1:8000`
  - **Description:** This variable contains the base URL for the Telegram Account Sessions API.