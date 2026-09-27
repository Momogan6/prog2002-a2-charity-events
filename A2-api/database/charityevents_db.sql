-- =====================================================================
-- PROG2002 Web Development II - Assessment 2
-- Database  : charityevents_db
-- Purpose   : Store and manage data for a dynamic charity events website
-- Engine    : MySQL 8.x / InnoDB
-- Author    : <Student Name> (<Student ID>)
--
-- How to use:
--   1. Open MySQL Workbench (or the mysql CLI).
--   2. Run this whole script. It creates the database, the tables,
--      and populates them with sample data (10 events, 3 organisations,
--      6 categories).
--   3. The API project connects to this database through
--      A2-api/event_db.js
-- =====================================================================

DROP DATABASE IF EXISTS charityevents_db;
CREATE DATABASE charityevents_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE charityevents_db;

-- ---------------------------------------------------------------------
-- Table 1: organisations
-- A charitable organisation that hosts one or more charity events.
-- One organisation -> many events (1:N).
-- ---------------------------------------------------------------------
CREATE TABLE organisations (
    organisation_id   INT             NOT NULL AUTO_INCREMENT,
    name              VARCHAR(150)    NOT NULL,
    description       VARCHAR(500)    NULL,
    email             VARCHAR(150)    NULL,
    phone             VARCHAR(50)     NULL,
    website           VARCHAR(255)    NULL,
    logo_url          VARCHAR(255)    NULL,
    created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organisation_id)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Table 2: categories
-- Event category, e.g. Fun Run, Gala Dinner, Silent Auction, Concert.
-- One category -> many events (1:N).
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    category_id   INT           NOT NULL AUTO_INCREMENT,
    name          VARCHAR(80)   NOT NULL,
    description   VARCHAR(255)  NULL,
    icon          VARCHAR(50)   NULL,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_categories_name (name)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Table 3: events
-- Each charity event belongs to exactly one organisation and one
-- category. `status` lets the organisation suspend an event that
-- violates policy (suspended events are hidden from the public site).
-- Whether an event is "upcoming" or "past" is derived from its dates.
-- ---------------------------------------------------------------------
CREATE TABLE events (
    event_id          INT             NOT NULL AUTO_INCREMENT,
    organisation_id   INT             NOT NULL,
    category_id       INT             NOT NULL,
    title             VARCHAR(200)    NOT NULL,
    summary           VARCHAR(300)    NULL,
    description       TEXT            NULL,
    location_name     VARCHAR(150)    NULL,
    address           VARCHAR(255)    NULL,
    city              VARCHAR(100)    NULL,
    start_datetime    DATETIME        NOT NULL,
    end_datetime      DATETIME        NULL,
    image_url         VARCHAR(255)    NULL,
    ticket_price      DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
    is_free           TINYINT(1)      NOT NULL DEFAULT 0,
    goal_amount       DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    raised_amount     DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    status            ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    KEY idx_events_category (category_id),
    KEY idx_events_organisation (organisation_id),
    KEY idx_events_start (start_datetime),
    KEY idx_events_status (status),
    CONSTRAINT fk_events_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (organisation_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_events_category
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Table 4: registrations  (created here for forward compatibility;
-- Step 2 (A2) only reads data, the write/registration flow is added
-- in Assessment 3.)
-- One event -> many registrations (1:N).
-- ---------------------------------------------------------------------
CREATE TABLE registrations (
    registration_id   INT             NOT NULL AUTO_INCREMENT,
    event_id          INT             NOT NULL,
    attendee_name     VARCHAR(150)    NOT NULL,
    attendee_email    VARCHAR(150)    NOT NULL,
    quantity          INT             NOT NULL DEFAULT 1,
    amount_paid       DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
    registered_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (registration_id),
    KEY idx_registrations_event (event_id),
    CONSTRAINT fk_registrations_event
        FOREIGN KEY (event_id) REFERENCES events (event_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- =====================================================================
-- Sample data
-- =====================================================================

INSERT INTO organisations (name, description, email, phone, website, logo_url) VALUES
('Bright Futures Foundation',
 'A not-for-profit organisation supporting education and wellbeing programs for children in regional communities.',
 'hello@brightfutures.org.au', '+61 2 6600 1000', 'https://www.brightfutures.org.au', '/images/org-brightfutures.png'),
('Coastal Hearts Charity',
 'Raises funds for coastal conservation and marine rescue services along the east coast.',
 'contact@coastalhearts.org.au', '+61 2 6600 2000', 'https://www.coastalhearts.org.au', '/images/org-coastalhearts.png'),
('Unity Health Trust',
 'Dedicated to improving access to healthcare and mental health services for vulnerable families.',
 'info@unityhealth.org.au', '+61 2 6600 3000', 'https://www.unityhealth.org.au', '/images/org-unityhealth.png');

INSERT INTO categories (name, description, icon) VALUES
('Fun Run',        'Community runs and walks for all fitness levels',      'run'),
('Gala Dinner',    'Formal evening dinners with entertainment',            'gala'),
('Silent Auction', 'Auctions of donated items and experiences',            'auction'),
('Concert',        'Live music and performance fundraising events',        'concert'),
('Trivia Night',   'Team-based quiz nights hosted by local venues',        'trivia'),
('Charity Walk',   'Guided walking events raising awareness and funds',    'walk');

-- 10 events. Dates use 2026 so that some are past and some are upcoming
-- relative to the assessment period (September 2026).
INSERT INTO events
(organisation_id, category_id, title, summary, description, location_name, address, city,
 start_datetime, end_datetime, image_url, ticket_price, is_free, goal_amount, raised_amount, status)
VALUES
-- 1 - past
(1, 1, 'Sunrise City Fun Run 2026',
 'A 5 km and 10 km family fun run through the city parklands.',
 'Join hundreds of runners and walkers at the Sunrise City Fun Run. Choose between the 5 km family loop or the 10 km challenge course. Every entry fee goes directly towards scholarships for regional students. Warm-up sessions, drink stations and a finish-line festival are included.',
 'Riverside Park', '1 Park Avenue', 'Lismore',
 '2026-06-14 06:30:00', '2026-06-14 11:00:00', '/images/fun-run.svg', 35.00, 0, 20000.00, 24500.00, 'active'),
-- 2 - upcoming
(1, 2, 'Bright Futures Gala Dinner',
 'An elegant black-tie dinner supporting children''s education programs.',
 'An unforgettable evening of fine dining, live entertainment and inspiring stories from the students your support helps. The gala includes a three-course dinner, a keynote speaker, live music and a fundraising appeal. Tables of eight and individual seats are available.',
 'The Grand Ballroom', '250 Keen Street', 'Lismore',
 '2026-10-18 18:30:00', '2026-10-18 23:00:00', '/images/gala.svg', 150.00, 0, 50000.00, 31200.00, 'active'),
-- 3 - upcoming
(2, 6, 'Coastal Sunset Charity Walk',
 'A guided 8 km coastal walk finishing with a community barbecue.',
 'Walk the beautiful coastline at golden hour while raising funds for marine rescue services. The route is suitable for most fitness levels and includes two rest stops with refreshments. The evening concludes with a community barbecue and a short talk from our rescue volunteers.',
 'Shelly Beach Boardwalk', '10 Ocean Drive', 'Coffs Harbour',
 '2026-11-07 16:00:00', '2026-11-07 20:00:00', '/images/charity-walk.svg', 25.00, 0, 15000.00, 6800.00, 'active'),
-- 4 - upcoming
(2, 3, 'Ocean Guardian Silent Auction',
 'Bid on exclusive experiences and artwork to protect our oceans.',
 'Browse and bid on more than sixty donated items, including original artworks, weekend getaways, restaurant vouchers and signed sports memorabilia. All proceeds support coastal conservation projects. Complimentary canapes and a cash bar are available on the night.',
 'Marina Function Centre', '5 Harbour Road', 'Coffs Harbour',
 '2026-10-25 19:00:00', '2026-10-25 22:30:00', '/images/auction.svg', 45.00, 0, 30000.00, 12750.00, 'active'),
-- 5 - upcoming
(3, 4, 'Harmony for Health Concert',
 'A live concert featuring local artists in support of mental health services.',
 'Enjoy an evening of live music from talented local bands and solo artists. The lineup spans acoustic, indie and contemporary styles. Funds raised will help provide free counselling sessions for families in need. Doors open at 6:30 pm.',
 'Civic Theatre', '77 Molesworth Street', 'Lismore',
 '2026-12-05 19:00:00', '2026-12-05 22:00:00', '/images/concert.svg', 60.00, 0, 40000.00, 9800.00, 'active'),
-- 6 - upcoming, free
(3, 5, 'Community Trivia Night',
 'A fun-filled trivia night with prizes, games and a great cause.',
 'Gather your smartest friends and compete for great prizes at our community trivia night. Tables of six, eight rounds of questions, a raffle and a silent auction will keep the evening buzzing. Entry is free; donations are welcome at the door.',
 'Southside Bowls Club', '18 Union Street', 'Lismore',
 '2026-10-03 18:00:00', '2026-10-03 21:30:00', '/images/trivia.svg', 0.00, 1, 8000.00, 3200.00, 'active'),
-- 7 - upcoming
(1, 1, 'Twilight Trail Run',
 'A picturesque 6 km twilight trail run through the rainforest reserve.',
 'Experience the rainforest at dusk on this beginner-friendly 6 km trail run. Head torches are provided, and marshals will guide you along the safe, well-marked route. The night finishes with a hot soup supper and a prize ceremony.',
 'Rainforest Reserve', '30 Hinterland Road', 'Lismore',
 '2026-11-21 17:30:00', '2026-11-21 21:00:00', '/images/trail-run.svg', 40.00, 0, 18000.00, 5400.00, 'active'),
-- 8 - past
(2, 3, 'Spring Art Auction',
 'An auction of local artworks that raised funds for coastal rescue boats.',
 'Our annual Spring Art Auction brought together more than forty local artists. Guests enjoyed a gallery viewing, live auction and supper. Thank you to everyone who supported this event.',
 'Community Gallery', '12 Arts Lane', 'Coffs Harbour',
 '2026-09-06 18:00:00', '2026-09-06 21:00:00', '/images/art-auction.svg', 30.00, 0, 25000.00, 26700.00, 'active'),
-- 9 - upcoming
(3, 2, 'Unity Health Charity Ball',
 'A masquerade ball raising funds for rural health equipment.',
 'Dust off your dancing shoes for a night of elegance at the Unity Health Charity Ball. The evening includes a three-course meal, live band, dancing and a grand raffle. Proceeds fund medical equipment for rural clinics.',
 'Heritage Hall', '101 Ballina Road', 'Lismore',
 '2026-12-19 18:30:00', '2026-12-20 00:30:00', '/images/ball.svg', 180.00, 0, 60000.00, 21000.00, 'active'),
-- 10 - suspended (violates policy, hidden from the public website)
(1, 6, 'Cancelled Forest Charity Walk',
 'This event has been suspended pending a compliance review.',
 'This event has been suspended by the organisation because the proposed route did not meet safety and permit requirements. It is retained in the database for record keeping but is not shown on the public website.',
 'State Forest', '99 Forest Track', 'Lismore',
 '2026-10-30 08:00:00', '2026-10-30 13:00:00', '/images/suspended.svg', 20.00, 0, 5000.00, 0.00, 'suspended');

-- =====================================================================
-- Sanity checks (optional) - run after the inserts
-- =====================================================================
-- SELECT COUNT(*) AS total_events FROM events;                       -- expect 10
-- SELECT COUNT(*) AS active_events FROM events WHERE status='active';-- expect 9
-- SELECT * FROM events WHERE status = 'active' ORDER BY start_datetime;
