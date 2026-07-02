# NCIE React Components

Reusable UI components for the NOVEE Craft Intelligence Engine. All components are designed to work with any Craft360 vertical and display honest preview states when live data is unavailable.

## Component Inventory

| Component | File | Purpose |
|-----------|------|---------|
| `NCIEKnowledgePanel` | `src/components/ncie/NCIEKnowledgePanel.jsx` | Expandable knowledge domain and topic browser |
| `NCIEMentorCard` | `src/components/ncie/NCIEMentorCard.jsx` | Mentor persona display with selection and session open action |
| `NCIEDecisionWidget` | `src/components/ncie/NCIEDecisionWidget.jsx` | Decision result display with confidence, alternatives, learn-more |
| `NCIERecommendationFeed` | `src/components/ncie/NCIERecommendationFeed.jsx` | Product, cross-craft, and lesson recommendation feed |
| `NCIEPassportProgress` | `src/components/ncie/NCIEPassportProgress.jsx` | Craft XP, global XP, mastery %, visit count display |
| `NCIEVerticalBadge` | `src/components/ncie/NCIEVerticalBadge.jsx` | Colored badge/chip for each Craft360 vertical |
| `NCIEMasteryMeter` | `src/components/ncie/NCIEMasteryMeter.jsx` | Circular mastery progress meter (compact and full) |
| `NCIECraftSelector` | `src/components/ncie/NCIECraftSelector.jsx` | Grid selector for all 14 Craft360 verticals |
| `NCIEAIStatusBadge` | `src/components/ncie/NCIEAIStatusBadge.jsx` | AI availability status display |
| `NCIECommerceInsightPanel` | `src/components/ncie/NCIECommerceInsightPanel.jsx` | Commerce intelligence signals with preview notice |
| `NCIEPlatformStatusBar` | `src/components/ncie/NCIEPlatformStatusBar.jsx` | NOVEE OS platform readiness and blocker display |

## Design Principles

- Every component shows `preview` label when live data is unavailable
- `inventory_unavailable` is shown prominently on product recommendation components
- AI unavailability is communicated clearly without alarming the user
- SmokeCraft Passport lock rules are never bypassed by these components
- No financial figures (revenue, payouts) are displayed as confirmed without verified data
- All monetary displays show preview/estimate labels

## Usage Example

```jsx
import NCIEKnowledgePanel from '../components/ncie/NCIEKnowledgePanel'
import NCIEMentorCard from '../components/ncie/NCIEMentorCard'
import NCIEPassportProgress from '../components/ncie/NCIEPassportProgress'

function SmokeCraftLearnScreen({ moduleId, guestId }) {
  return (
    <div className="space-y-4">
      <NCIEPassportProgress
        profile={masteryProfile}
        moduleId={moduleId}
      />
      <NCIEKnowledgePanel
        moduleId={moduleId}
        domains={knowledgeMap.domains}
        onTopicSelect={handleTopicSelect}
      />
      {mentors.map(mentor => (
        <NCIEMentorCard
          key={mentor.mentorId}
          mentor={mentor}
          onSelectMentor={handleMentorSelect}
          isSelected={selectedMentorId === mentor.mentorId}
        />
      ))}
    </div>
  )
}
```
