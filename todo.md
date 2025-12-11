# Smart Lifestyle Assistant - TODO

## Database Schema
- [x] User wellness profile table (nutritional goals, preferences, health metrics)
- [x] Course schedule table (imported from TUM calendar)
- [x] Meal history table (track meals, nutrition, expenses)
- [x] Commute history table (routes, times, preferences)
- [x] Focus mode settings table (current mode, schedules)
- [x] AI conversation history table (chat with AI coordinator)
- [x] Classroom locations table (TUM campus buildings and rooms)

## Backend API Development
- [x] Google Gemini API integration service
- [x] Google Maps API integration for location and routing
- [x] MVV Munich transport API integration
- [x] TUM Mensa (canteen) data scraper/API
- [x] Calendar import endpoint (.ics file parser)
- [x] Wellness profile management API
- [x] Meal recommendation API with AI
- [x] Commute planning API with real-time MVV data
- [x] Time management API with Focus Modes
- [x] AI chat endpoint for natural language interaction

## Frontend Development
- [x] Landing page with feature introduction
- [x] User authentication (login/register)
- [x] Dashboard layout with navigation
- [x] Profile setup wizard (initial wellness goals)
- [x] Calendar view with course schedule
- [x] Meal planner with TUM Mensa recommendations
- [x] Commute planner with map and route display
- [x] Time management interface with Focus Mode selector
- [x] AI chat interface for conversational interaction
- [x] Settings page for preferences and goals

## AI Coordinator Features
- [ ] Dynamic wellness profile learning
- [ ] Cross-module optimization (meals + schedule + commute)
- [ ] Proactive suggestions based on patterns
- [ ] Natural language understanding for mode switching
- [ ] Predictive alerts (traffic, nutrition goals, time conflicts)

## External Data Integration
- [ ] Real MVV transport schedules and routes
- [ ] TUM Mensa daily menus and prices
- [ ] TUM classroom locations and building info
- [ ] Google Maps for campus navigation

## Testing
- [ ] Unit tests for backend services
- [ ] Integration tests for AI coordinator
- [ ] E2E tests for critical user flows
- [ ] Performance testing for real-time features

## Documentation
- [ ] User guide for getting started
- [ ] API documentation
- [ ] Deployment instructions

## Map Integration Enhancement
- [x] Add interactive Google Maps to Commute page
- [x] Mark TUM campus buildings (Garching, Innenstadt, Weihenstephan)
- [x] Display route visualization on map
- [x] Add markers for start and destination points
- [x] Show route polylines with different colors for different transport modes

## TUM Account Binding Feature
- [x] Extend database schema to store TUM student information
- [x] Create email verification system for TUM accounts
- [x] Add backend API for TUM account binding
- [x] Create TUM account binding UI in Profile page
- [x] Implement onboarding flow after first login
- [x] Add verification code generation and validation
- [x] Display TUM account status in user profile
- [x] Test email verification flow

## Login Flow Fix
- [x] Add automatic redirect to Dashboard after login
- [x] Update Landing page to check auth status and redirect
- [x] Test login flow end-to-end

## Real Email Service Integration
- [x] Install nodemailer package
- [x] Create email service with Gmail SMTP
- [ ] Request SMTP credentials from user
- [x] Update email verification to use real SMTP
- [ ] Test email delivery to TUM addresses

## ICS Calendar Import Feature
- [x] Install ical.js or node-ical library
- [x] Create backend API for .ics file upload
- [x] Parse .ics file and extract course events
- [x] Save parsed courses to database
- [x] Add file upload UI to Schedule page
- [x] Display imported courses in calendar view
- [x] Test with real TUM Online .ics file

## DB (Deutsche Bahn) API Integration
- [x] Install hafas-client library for DB API
- [x] Replace MVV service with DB Hafas API
- [x] Update route planning to use DB journeys endpoint
- [x] Test real-time public transport queries
- [x] Update Commute page to display DB results

## AI Course Schedule Integration & Home Address
- [x] Add home address fields to wellness profile table
- [x] Fix AI recommendation to access user's course schedule
- [x] Pass course data to Gemini API for context-aware suggestions
- [x] Add home address input to Profile page
- [x] Integrate home address into commute planning (home → campus)
- [x] Add quick "Go Home" button in Commute page
- [x] Test AI recommendations with real course data

## OpenMensa API Integration
- [x] Create OpenMensa API service to fetch Heilbronn Mensa menu
- [x] Add backend API endpoint to get daily menu from OpenMensa
- [x] Develop AI-powered portion size recommendation based on fitness goals
- [x] Update Meals page to display real menu data
- [x] Add nutrition information display (calories, protein, price)
- [x] Test OpenMensa API integration

## Heilbronn Campus Address Mapping
- [x] Create building address mapping for Heilbronn campus
- [x] Map room numbers starting with digits to Etzelstraße 38
- [x] Map room numbers starting with 'D' to Bildungscampus 2
- [x] Map room numbers starting with 'C' to Weipertstraße 8-10
- [x] Update calendar parser to extract and map classroom addresses
- [x] Integrate classroom addresses into commute planning
- [x] Test with real course schedule data
