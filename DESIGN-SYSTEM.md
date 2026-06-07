# 🎨 Blink Social Design System

## 🎯 Brand Identity

Blink Social owns **purple** as its primary brand color, with **blue** for CTAs and **pink** for accents — distinct from Instagram (sunset gradient), TikTok (cyan + pink), and Discord (blurple).

| Color  | Hex       | Role                            |
| ------ | --------- | ------------------------------- |
| 🟣 Purple | `#8A2EFF` | Brand / logo / wordmark        |
| 🔵 Blue   | `#00B7FF` | Primary CTA / buttons / links  |
| 🩷 Pink   | `#FF2BA6` | Accent / likes / badges / highlights |

---

## 🎨 Color Tokens

### ☀️ Light Mode

| Token           | Value      | Usage                              |
| --------------- | ---------- | ---------------------------------- |
| `bg`            | `#FFFFFF`  | Page background                    |
| `bg-secondary`  | `#F7F8FC`  | Card / sidebar / input background  |
| `bg-tertiary`   | `#F0F2F8`  | Hover states                       |
| `text`          | `#0F1226`  | Primary text                       |
| `text-secondary`| `#8B8FA3`  | Secondary text / placeholders      |
| `border`        | `#E2E5ED`  | Borders / dividers                 |
| `brand`         | `#8A2EFF`  | Brand color                        |
| `primary`       | `#00B7FF`  | CTA buttons / links / active nav   |
| `accent`        | `#FF2BA6`  | Likes / unread dots / highlights   |
| `danger`        | `#ED4956`  | Errors / destructive actions       |
| `success`       | `#22C55E`  | Success states                     |
| `warning`       | `#F59E0B`  | Warning states                     |

### 🌙 Dark Mode

| Token           | Value                      | Usage                                  |
| --------------- | -------------------------- | -------------------------------------- |
| `bg`            | `#0F1226`                  | Page background                        |
| `bg-secondary`  | `#1A1E35`                  | Card / sidebar / input background      |
| `bg-tertiary`   | `#252A45`                  | Hover states                           |
| `text`          | `#F7F8FC`                  | Primary text                           |
| `text-secondary`| `#8B8FA3`                  | Secondary text / placeholders          |
| `border`        | `rgba(255,255,255,0.08)`   | Borders / dividers                     |
| `brand`         | `#A24BFF`                  | Brand color (brighter for dark BG)     |
| `primary`       | `#4FD3FF`                  | CTA buttons / links (brighter for dark)|
| `accent`        | `#FF4FC0`                  | Accent (brighter for dark BG)          |

### 🌈 Gradients

```css
--gradient-brand: linear-gradient(135deg, #FF2BA6, #8A2EFF, #00B7FF);
```

---

## 🔤 Typography

| Token      | Size  | Usage                      |
| ---------- | ----- | -------------------------- |
| `text-xs`  | 12px  | Labels, timestamps         |
| `text-sm`  | 13px  | Body text, descriptions    |
| `text-base`| 14px  | Default body               |
| `text-lg`  | 16px  | Card titles                |
| `text-xl`  | 20px  | Section headings           |
| `text-2xl` | 24px  | Page titles                |
| `text-3xl` | 32px  | Hero / brand headers       |

🔤 Font family: `Inter, system-ui, -apple-system, sans-serif`

---

## 📐 Spacing

📏 **4px base grid** — all spacing uses Tailwind's spacing scale (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, etc.)

---

## 🔘 Border Radius

| Token                     | Value  | Usage                         |
| ------------------------- | ------ | ----------------------------- |
| `rounded-sm`              | 4px    | Small elements                |
| `rounded` / `rounded-md`  | 8px    | Cards, inputs, buttons        |
| `rounded-lg`              | 12px   | Modals, large containers      |
| `rounded-xl`              | 16px   | Featured containers           |
| `rounded-full`            | 9999px | Avatars, pills, badges        |

---

## 🌓 Shadows

| Class              | Usage                |
| ------------------ | -------------------- |
| `shadow-sm`        | Subtle elevation     |
| `shadow` / `shadow-md` | Cards, dropdowns |
| `shadow-lg`        | Modals, toasts       |

---

## 🧩 Components

### 🔘 Button

An all-purpose button with loading state and icon support.

```tsx
import { Button } from '@/components/ui/Button';

// Variants
<Button variant="primary">    // 🔵 Blue CTA (default)
<Button variant="secondary">  // ◻️ Outline
<Button variant="ghost">      // 👻 Ghost
<Button variant="danger">     // 🔴 Red destructive
<Button variant="brand">      // 🟣 Purple brand
<Button variant="accent">     // 🩷 Pink accent

// Sizes
<Button size="sm">
<Button size="md">            // Default
<Button size="lg">

// States
<Button loading>              // ⏳ Shows spinner, disables
<Button disabled>
<Button icon={<Star />}>      // ⭐ Icon slot (replaced by spinner when loading)

// Full width
<Button className="w-full">
```

Props: `variant`, `size`, `loading`, `icon`, `className`, plus all native `<button>` attributes.

---

### ⌨️ Input

Form input with label, helper text, and error state.

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={...}
  error="Invalid email"        // 🚫 Shows red border + error message
  helperText="We'll never share your email"  // ℹ️ Shown when no error
/>
```

Props: `label`, `helperText`, `error`, plus all native `<input>` attributes.

---

### 📝 Textarea

Multi-line text input.

```tsx
import { Textarea } from '@/components/ui/Textarea';

<Textarea
  label="Caption"
  placeholder="Write something..."
  rows={3}
  error="Required"
/>
```

Props: `label`, `error`, plus all native `<textarea>` attributes.

---

### 👤 Avatar

User avatar with image fallback to initials and optional online indicator.

```tsx
import { Avatar } from '@/components/ui/Avatar';

<Avatar
  src="/uploads/avatar.jpg"   // Falls back to initials on error
  alt="John Doe"              // Used to generate initials
  size="md"                   // xs / sm / md / lg / xl
  online                      // 🟢 Shows green dot
  gradientBorder              // 🌈 Story-style gradient ring
  fallback="JD"               // Override initials
/>
```

---

### 🏷 Badge

Inline label / pill for counts and statuses.

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="primary">3</Badge>    // 🔵 Blue
<Badge variant="accent">!</Badge>     // 🩷 Pink
<Badge variant="success">Live</Badge> // 🟢 Green
<Badge variant="warning">Pending</Badge> // 🟡 Yellow
<Badge variant="danger">Error</Badge>    // 🔴 Red
<Badge variant="default">Draft</Badge>   // ⚪ Neutral

<Badge size="sm">New</Badge>
```

---

### ⏳ Spinner

Loading indicator.

```tsx
import { Spinner } from '@/components/ui/Spinner';

<Spinner size="md" />    // sm / md / lg
<Spinner className="text-primary" />  // 🎨 Custom color
```

---

### 🔄 Toggle

Switch toggle for settings.

```tsx
import { Toggle } from '@/components/ui/Toggle';

<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="Dark mode"
  disabled
/>
```

---

### 🃏 Card

Content container.

```tsx
import { Card } from '@/components/ui/Card';

<Card variant="default">       // Bordered (default)
<Card variant="interactive">   // 👆 Hover effect, cursor pointer
<Card variant="elevated">      // Shadow + subtle border

<Card onClick={handleClick}>   // Renders as <button>
```

---

### 🪟 Modal

Dialog overlay with backdrop blur, Escape-to-close, and click-outside-to-close.

```tsx
import { Modal } from '@/components/ui/Modal';

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm"
  size="sm"                    // sm / md (default) / lg
>
  <p>Are you sure?</p>
  <Button onClick={...}>Confirm</Button>
</Modal>
```

---

### 📑 Tabs

Tab navigation with two style variants.

```tsx
import { Tabs, type Tab } from '@/components/ui/Tabs';

const tabs: Tab[] = [
  { label: 'Posts', value: 'posts' },
  { label: 'Saved', value: 'saved' },
  { label: 'Tagged', value: 'tagged' },
];

<Tabs
  tabs={tabs}
  value={activeTab}
  onChange={setActiveTab}
  variant="underline"          // ➖ underline / 💊 pill
/>
```

---

### 📋 DropdownMenu

Click-triggered menu with items.

```tsx
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu';

<DropdownMenu trigger={<Button>Options</Button>} align="right">
  <DropdownItem onClick={...}>Edit</DropdownItem>
  <DropdownItem onClick={...} danger>Delete</DropdownItem>
</DropdownMenu>
```

---

### 💬 Tooltip

Hover tooltip with configurable delay and position.

```tsx
import { Tooltip } from '@/components/ui/Tooltip';

<Tooltip content="Like this post" position="top" delay={500}>
  <button>♥</button>
</Tooltip>
```

Positions: `top` (default), `bottom`, `left`, `right`.

---

### 💀 Skeleton

Loading placeholders with preset compositions.

```tsx
import { Skeleton, PostSkeleton, ProfileSkeleton, GridSkeleton, MessageSkeleton, NotificationSkeleton } from '@/components/ui/Skeleton';

<Skeleton className="h-8 w-8" variant="circular" />  // text / circular / rectangular
<PostSkeleton />
<ProfileSkeleton />
<GridSkeleton count={6} />
<MessageSkeleton />
<NotificationSkeleton />
```

---

### 📭 EmptyState

Empty / no-data state with optional action.

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon="📸"
  title="No posts yet"
  description="Follow users to see their posts."
  action={{ label: 'Explore', href: '/explore' }}    // 🔗 Link variant
  action={{ label: 'Retry', onClick: handleRetry }}   // 🔄 Button variant
/>
```

---

### ⚠️ ErrorDisplay

Error state with optional retry button.

```tsx
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

<ErrorDisplay
  message="Failed to load feed"
  onRetry={loadFeed}
  icon={<CustomIcon />}   // Default "❗"
/>
```

---

### 🍞 Toast

Imperative notifications.

```tsx
import { toast } from '@/components/ui/Toast';

toast('Post created!', 'success');  // success / error / info / brand
```

Place `<ToastContainer />` once in the root layout (✅ already done).

---

### 🌗 ThemeProvider

Dark mode context provider. Wrap at app root (✅ already done in `layout.tsx`).

```tsx
import { ThemeProvider, useTheme } from '@/components/ui/ThemeProvider';

// In any component:
const { theme, toggleTheme, setTheme } = useTheme();
<button onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

💾 Persistence: Saves to `localStorage`, falls back to `prefers-color-scheme`.

---

## 📝 Usage Guidelines

### 🏷 Class Naming

- Use semantic tokens: `bg-bg`, `text-text`, `border-border`, `bg-primary`, `text-brand`
- 🚫 Dark mode is automatic via CSS variables — **no** `dark:` prefix needed for core tokens
- Use `dark:` prefix for one-off overrides: `dark:shadow-blue-500/20`

### 🧱 Component Composition

```tsx
<Card className="p-4">
  <div className="flex items-center gap-3">
    <Avatar src={user.avatarUrl} alt={user.username} />
    <div>
      <p className="text-sm font-semibold">{user.displayName}</p>
      <p className="text-xs text-text-secondary">{user.username}</p>
    </div>
  </div>
</Card>
```

### 🌙 Dark Mode Support

All components are dark mode aware automatically. The ThemeProvider toggles a `.dark` class on `<html>`, and CSS variables update all semantic color tokens. **No per-component dark mode code needed.**

---

## 📁 File Structure

```
apps/web/src/
├── components/ui/
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── DropdownMenu.tsx
│   ├── EmptyState.tsx
│   ├── ErrorDisplay.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Skeleton.tsx
│   ├── Spinner.tsx
│   ├── Tabs.tsx
│   ├── Textarea.tsx
│   ├── ThemeProvider.tsx
│   ├── Toast.tsx
│   ├── Toggle.tsx
│   └── Tooltip.tsx
├── lib/
│   └── utils.ts            # cn() helper
└── app/
    └── globals.css          # 🎨 Theme tokens
```
