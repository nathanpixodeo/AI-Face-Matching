# AI Face Matching — Frontend Specification

> For designer reference. Backend API is Fastify/TypeScript, endpoints documented at `/docs` (Swagger UI).
> Frontend will be React + Tailwind + TanStack Query (built separately).

---

## 1. Pages Overview

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| Login | `/login` | No | Email + password login |
| Register | `/register` | No | Create account + team |
| Dashboard | `/` | Yes | Stats, recent batches, quick actions |
| Identities | `/identities` | Yes | List of known people |
| Identity Detail | `/identities/:id` | Yes | Person profile + linked faces gallery |
| Upload | `/upload` | Yes | Drag & drop images, processing progress |
| Upload Review | `/upload/:batchId/review` | Yes | Review auto-mapped faces, confirm/adjust |
| Face Match | `/match` | Yes | Upload photo, see matching identities |
| Image Library | `/images` | Yes | Grid of all team images |
| Image Detail | `/images/:id` | Yes | Image with detected face overlays |
| Workspaces | `/workspaces` | Yes | Workspace list + management |
| Team Settings | `/settings` | Yes | Members, plan, usage |

---

## 2. Layout

### App Shell (authenticated pages)
```
┌─────────────────────────────────────────────────┐
│  Top Bar                                         │
│  [Logo]  [Search]           [User Menu ▾]       │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Main Content                        │
│          │                                      │
│ Dashboard│                                      │
│ Identit. │                                      │
│ Upload   │                                      │
│ Match    │                                      │
│ Images   │                                      │
│ Worksp.  │                                      │
│ Settings │                                      │
│          │                                      │
├──────────┴──────────────────────────────────────┤
│  (No footer — infinite scroll where applicable) │
└─────────────────────────────────────────────────┘
```

- **Sidebar**: collapsible on tablet, hidden on mobile (hamburger menu)
- **Top Bar**: fixed, z-10, background blur
- **User Menu**: dropdown with team name, plan badge, logout

### Auth Layout (login, register)
- Centered card, max-width 420px, full-height background

---

## 3. Responsive Breakpoints

| Name | Min Width | Sidebar | Grid Columns |
|------|-----------|---------|--------------|
| Mobile | < 768px | Hidden (hamburger) | 1-2 |
| Tablet | 768-1024px | Collapsed (icons only) | 2-3 |
| Desktop | > 1024px | Expanded (icons + labels) | 3-4 |

---

## 4. Page Details

### 4.1 Login (`/login`)

**Components:**
- Card (centered, shadow-lg)
  - Logo + app name
  - Email input (type=email, required)
  - Password input (type=password, required)
  - "Login" button (primary, full-width)
  - Link: "Don't have an account? Register"
  - Error alert (inline, red)

**States:**
- Default: empty form
- Loading: button disabled, spinner
- Error: inline error message below form
- Success: redirect to dashboard

**API:** `POST /api/auth/login`

---

### 4.2 Register (`/register`)

**Components:**
- Card (centered)
  - First Name + Last Name (side by side)
  - Email input
  - Password input (min 8 chars, show strength indicator)
  - Team Name input
  - "Create Account" button (primary)
  - Link: "Already have an account? Login"

**Validation:**
- Password: min 8 characters, strength bar (weak/medium/strong)
- Email: format validation
- All fields required

**API:** `POST /api/auth/register`

---

### 4.3 Dashboard (`/`)

**Components:**
- **Stats Row** (4 cards, horizontal scroll on mobile)
  - Total Identities (icon: users)
  - Total Images (icon: image)
  - Total Faces (icon: scan)
  - Matches Today (icon: search)
- **Quick Actions** (2 buttons)
  - "Upload Images" → `/upload`
  - "Match Face" → `/match`
- **Recent Batches** (table/list, last 5)
  - Columns: date, images count, faces detected, status badge, action
  - Status badges: uploading (blue), processing (yellow), review (orange), completed (green), failed (red)
- **Plan Usage** (progress bars)
  - Identities: X / max
  - Images: X / max
  - Matches today: X / max
  - Storage: X MB / max MB

**API:**
- `GET /api/faces/stats`
- `GET /api/uploads/batches?limit=5`
- `GET /api/team`

---

### 4.4 Identities (`/identities`)

**Components:**
- **Header**: "Identities" title + "Create Identity" button (primary)
- **Search bar**: text input, debounced 300ms
- **Grid/List toggle**: grid (cards) or list (table) view
- **Identity cards** (grid view):
  - Avatar (first face thumbnail or placeholder icon)
  - Name (bold)
  - Description (truncated, 2 lines)
  - Faces count badge
  - Click → `/identities/:id`
- **Pagination**: page numbers or infinite scroll

**Create Identity Modal:**
- Name input (required)
- Description textarea (optional)
- "Create" + "Cancel" buttons

**Empty State:** Illustration + "No identities yet. Create your first identity to start organizing faces."

**API:**
- `GET /api/identities?page=1&limit=20&search=`
- `POST /api/identities`

---

### 4.5 Identity Detail (`/identities/:id`)

**Components:**
- **Profile Header**:
  - Avatar (large, from avatarFaceId or placeholder)
  - Name (editable inline)
  - Description (editable inline)
  - Faces count
  - Edit / Delete buttons
- **Linked Faces Gallery**:
  - Grid of face thumbnails (cropped from source image using bbox)
  - Each card: face crop, source image name, age/gender, confidence %, mapping status badge
  - Click face → modal with full image + face highlighted

**Delete Confirmation:** "This will unlink all X faces from this identity. The faces will remain in the library as unmatched."

**API:**
- `GET /api/identities/:id`
- `GET /api/identities/:id/faces`
- `PUT /api/identities/:id`
- `DELETE /api/identities/:id`

---

### 4.6 Upload (`/upload`)

**Components:**
- **Drop Zone** (large, dashed border):
  - Drag & drop area
  - "or click to browse" text
  - Accepted formats: JPG, PNG, WEBP, BMP
  - File count + size limit display (from plan)
- **Upload Queue** (after files selected):
  - File list with thumbnails, names, sizes
  - Remove individual files (X button)
  - "Upload All" button (primary)
- **Processing Progress** (after upload starts):
  - Overall progress bar with %
  - Per-image status: pending (gray), processing (yellow spinner), done (green check), failed (red X)
  - Live update via SSE (`GET /api/uploads/batches/:id/progress`)
  - When complete → "Review Mappings" button (orange, prominent)

**Flow:** Select files → Preview → Upload → Processing (live) → Review button

**API:**
- `POST /api/uploads` (multipart)
- `GET /api/uploads/batches/:id/progress` (SSE)

---

### 4.7 Upload Review (`/upload/:batchId/review`) — KEY PAGE

This is the most complex page. Similar to Google Photos face grouping.

**Components:**
- **Summary Bar** (sticky top):
  - Total faces detected
  - Auto-mapped count (green)
  - Unmatched count (orange)
  - "Confirm All" button (primary)
  - "Save & Complete" button (when adjusted)

- **Face Review Grid**:
  - Each card represents one detected face:
    ```
    ┌────────────────────────────┐
    │  [Face Crop Thumbnail]     │
    │                            │
    │  Age: 28 | Gender: Male    │
    │  Quality: 92%              │
    │                            │
    │  Suggested: "John Doe" ✓   │
    │  Confidence: 87%           │
    │                            │
    │  [Confirm] [Change ▾]     │
    │  [Create New] [Skip]       │
    └────────────────────────────┘
    ```

  - **Auto-mapped faces** (green border):
    - Shows suggested identity name + confidence %
    - "Confirm" button (quick action)
    - "Change" dropdown → select different identity
  - **Unmatched faces** (orange border):
    - "No match found"
    - "Assign to..." dropdown → select existing identity
    - "Create New Identity" button → inline name/desc form
    - "Skip" button (ignore this face)

- **Bulk Actions Bar** (when faces selected):
  - Checkbox select on each face
  - "Assign selected to..." dropdown
  - "Skip selected"

- **Existing Identities Sidebar** (right panel on desktop, bottom sheet on mobile):
  - Searchable list of team identities
  - Drag identity onto face card to assign (desktop)
  - Tap to assign (mobile)

**States:**
- Loading: skeleton cards
- Review: faces with mapping controls
- Submitting: progress indicator
- Done: redirect to batch detail or dashboard

**API:**
- `GET /api/uploads/batches/:id/review`
- `PUT /api/uploads/batches/:id/review`

---

### 4.8 Face Match (`/match`)

**Components:**
- **Upload Area** (single file):
  - Drop zone or click (single image only)
  - Preview of uploaded photo
  - "Find Matches" button
- **Query Face Info** (after result):
  - Detected face crop
  - Age, gender
- **Results Grid**:
  - Ranked list of matching identities
  - Each card:
    - Identity avatar
    - Name
    - Similarity % (large, colored: >80% green, 60-80% yellow, <60% orange)
    - Description
    - Click → `/identities/:id`
- **No Match State**: "No matching identities found. The person may not be registered yet."

**API:** `POST /api/faces/match` (multipart, single file)

---

### 4.9 Image Library (`/images`)

**Components:**
- **Header**: "Images" title + filter controls
- **Filters**: status dropdown (all/pending/processed/failed)
- **Image Grid** (masonry or uniform):
  - Thumbnail
  - Original filename (truncated)
  - Faces detected badge (number)
  - Status badge
  - Click → `/images/:id`
- **Pagination**: infinite scroll or page numbers

**Empty State:** "No images uploaded yet. Start by uploading images."

**API:** `GET /api/images?page=1&limit=20&status=`

---

### 4.10 Image Detail (`/images/:id`)

**Components:**
- **Image Viewer** (full width):
  - Original image at max resolution
  - Face bounding box overlays (rectangles with labels)
  - Click face overlay → show face detail popover
- **Image Info Panel** (sidebar or below):
  - Original name, size, upload date
  - Status badge
  - Faces detected count
- **Detected Faces List**:
  - Face crop thumbnail
  - Linked identity name (or "Unmatched")
  - Age, gender
  - Mapping status badge
  - "Assign" button for unmatched faces
- **Actions**: Delete image (with confirmation)

**API:**
- `GET /api/images/:id`
- `DELETE /api/images/:id`

---

### 4.11 Workspaces (`/workspaces`)

**Components:**
- **Header**: "Workspaces" title + "Create Workspace" button
- **Table**:
  - Columns: name, notes (truncated), status (active/inactive toggle), created, actions
  - Actions: edit (inline or modal), delete
- **Create/Edit Modal**:
  - Name input (required)
  - Notes textarea (optional)
  - Status toggle

**API:**
- `GET /api/workspaces`
- `POST /api/workspaces`
- `PUT /api/workspaces/:id`
- `DELETE /api/workspaces/:id`

---

### 4.12 Team Settings (`/settings`)

**Components:**
- **Tabs**: General | Members | Plan & Usage

**General Tab:**
- Team name (editable)
- Team ID (read-only, copy button)

**Members Tab:**
- Members table: name, email, role badge (owner/admin/member), joined date
- "Invite Member" button → email + role form
- Role change dropdown (admin only, cannot change owner)
- Remove member button (with confirmation)

**Plan & Usage Tab:**
- Current plan card (name, price)
  - "Upgrade" button if on Free
- Usage meters (progress bars with labels):
  - Identities: current / max
  - Images: current / max
  - Matches today: current / max
  - API calls today: current / max
  - Storage: current MB / max MB
  - Team members: current / max
- Usage bars color: green (<70%), yellow (70-90%), red (>90%)

**API:**
- `GET /api/team`
- `PUT /api/team`
- `GET /api/team/members`
- `POST /api/team/members`
- `PUT /api/team/members/:id`
- `DELETE /api/team/members/:id`
- `PUT /api/team/plan`

---

## 5. Common Components

| Component | Usage |
|-----------|-------|
| **Button** | Primary (blue), secondary (gray), danger (red), ghost |
| **Badge** | Status colors, plan names, role labels |
| **Card** | Stats, identity, face, image thumbnails |
| **Modal** | Create/edit forms, confirmations, face detail |
| **Table** | Members, workspaces, batches |
| **DropZone** | Upload, match (drag & drop + click) |
| **ProgressBar** | Usage meters, upload progress |
| **SearchInput** | Debounced, with clear button |
| **Pagination** | Page numbers or infinite scroll |
| **EmptyState** | Illustration + message + CTA button |
| **Toast** | Success (green), error (red), info (blue) — bottom-right |
| **Skeleton** | Loading placeholders matching content shape |
| **Avatar** | Identity avatar (face crop or initials fallback) |
| **BBox Overlay** | Canvas/CSS overlay for face rectangles on images |

---

## 6. Data States (every component)

| State | Visual |
|-------|--------|
| **Loading** | Skeleton shimmer matching content layout |
| **Empty** | Illustration + descriptive text + action button |
| **Success** | Content rendered normally |
| **Error** | Red alert with message + retry button |
| **Processing** | Spinner or progress bar with status text |

---

## 7. User Flows

### 7.1 First-Time User
```
Register → Dashboard (empty) → Create first Identity →
Upload Images → Processing → Review Mappings → Dashboard (with stats)
```

### 7.2 Returning User — Upload Flow
```
Dashboard → Upload page → Select/drop images → Upload starts →
Processing progress (live) → "Review" button →
Review page: confirm auto-maps, assign unmatched, create new identities →
Submit → Dashboard updated
```

### 7.3 Face Match / Search
```
Dashboard → Match page → Upload single photo →
Results: ranked identities with similarity % →
Click identity → Identity detail page
```

### 7.4 Identity Management
```
Identities list → Click identity → See profile + all linked faces →
Edit name/description → View face detail → Unlink face if needed
```

---

## 8. Color Tokens (recommendation)

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | Blue 600 | Buttons, links, active states |
| `success` | Green 500 | Completed, confirmed, high match |
| `warning` | Yellow 500 | Processing, medium match |
| `danger` | Red 500 | Failed, delete, low match, errors |
| `accent` | Orange 500 | Review needed, unmatched |
| `neutral-50` | Gray 50 | Page background |
| `neutral-100` | Gray 100 | Card background |
| `neutral-200` | Gray 200 | Borders |
| `neutral-700` | Gray 700 | Body text |
| `neutral-900` | Gray 900 | Headings |

---

## 9. Typography

| Element | Size | Weight |
|---------|------|--------|
| H1 (page title) | 24px / 1.5rem | 700 |
| H2 (section) | 20px / 1.25rem | 600 |
| H3 (card title) | 16px / 1rem | 600 |
| Body | 14px / 0.875rem | 400 |
| Small / Caption | 12px / 0.75rem | 400 |
| Badge text | 12px / 0.75rem | 500 |

Font family: Inter (primary), system-ui fallback.

---

## 10. API Authentication

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

Token is received on login/register and stored in localStorage or httpOnly cookie.

Response format (all endpoints):
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

Error format:
```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

---

## 11. Plan Limits (display in UI)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Identities | 50 | 5,000 | Unlimited |
| Images | 500 | 50,000 | Unlimited |
| Matches/day | 50 | 5,000 | Unlimited |
| API calls/day | 100 | 10,000 | Unlimited |
| Storage | 500 MB | 10 GB | Unlimited |
| Team members | 2 | 10 | Unlimited |
| Files/upload | 10 | 100 | 1,000 |
| Price | Free | $29/mo | $99/mo |
