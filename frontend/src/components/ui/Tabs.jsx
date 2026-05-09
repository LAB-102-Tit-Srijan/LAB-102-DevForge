import { useState } from 'react';

const Tabs = ({ tabs, defaultTab, className = '', onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl border border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;
