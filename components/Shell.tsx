"use client";

import { Icon, useApp } from "./ctx";

const CHATS = [
  "Commercial due diligence",
  "Market analysis",
  "Financial modeling",
  "Risk assessment",
  "Market analysis and positioning",
  "Threat identification",
  "Mitigation strategies",
  "Incident response",
  "Stakeholder communication",
  "Customer segmentation",
  "Value proposition evaluation",
];

export function Nav() {
  return (
    <nav className="nav" aria-label="Workspace">
      <div className="nav__ws">
        <div className="nav__wsrow">
          <span className="nav__wsname">Teamroom</span>
          <button className="nav__iconbtn" aria-label="Collapse sidebar">
            <Icon name="layout-align-left" />
          </button>
        </div>
      </div>
      <div className="nav__proj">
        <button className="nav__projrow" style={{ width: "100%" }}>
          <span>Project Latios</span>
          <Icon name="chevron-right" className="rot90" />
        </button>
      </div>
      <div className="nav__scroll">
        <div className="nav__search">
          <Icon name="search-nav" />
          <span>Search</span>
          <span>⌘K</span>
        </div>
        <div className="nav__groups">
          <div className="nav__group">
            <a className="nav__item" href="#">
              <span className="icon14"><Icon name="plus" /></span>
              <span>New</span>
            </a>
            <a className="nav__item" href="#">
              <span className="icon14"><Icon name="elements" /></span>
              <span>Skills</span>
            </a>
            <a className="nav__item" href="#">
              <span className="icon14"><Icon name="clock" /></span>
              <span>Scheduled</span>
            </a>
            <a className="nav__item" href="#">
              <span className="icon14"><Icon name="folder" /></span>
              <span>Files</span>
              <span className="nav__count nav__count--dark">18</span>
            </a>
          </div>
          <div className="nav__group">
            <div className="nav__head">Tools <Icon name="arrow-down" /></div>
            <a className="nav__item nav__item--active" href="#" aria-current="page">
              <span className="icon14"><Icon name="ai-mic" /></span>
              <span>Interviews</span>
              <span className="nav__count">24</span>
            </a>
            <a className="nav__item" href="#">
              <span className="icon14"><Icon name="transcribe" /></span>
              <span>Trascripts</span>
              <span className="nav__count">13</span>
            </a>
            <a className="nav__item" href="#">
              <span className="icon14"><Icon name="sheets" /></span>
              <span>Data tables</span>
            </a>
            <a className="nav__item" href="#">
              <span className="icon14"><Icon name="web" /></span>
              <span>Deep research</span>
            </a>
          </div>
          <div className="nav__group">
            <div className="nav__head">Chats <Icon name="arrow-down" /></div>
            {CHATS.map((c) => (
              <a key={c} className="nav__chat" href="#">{c}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="nav__foot">
        <div className="nav__footrow">
          <div className="nav__user">
            <span className="avatar">C</span>
            <span>Corey Lubin</span>
          </div>
          <Icon name="chevron-down" />
        </div>
      </div>
    </nav>
  );
}

export function TopBar() {
  return (
    <header className="topbar">
      <p className="topbar__title">FreshCart membership cancellation</p>
      <div className="topbar__tabs" role="tablist" aria-label="Project">
        <button className="ttab ttab--active" role="tab" aria-selected>Interview guide</button>
        <button className="ttab" role="tab" aria-selected={false}>Recruit</button>
        <button className="ttab" role="tab" aria-selected={false}>Responses</button>
        <button className="ttab" role="tab" aria-selected={false}>Report</button>
      </div>
      <div className="topbar__right">
        <button className="btn-ghost"><Icon name="chat" /> Support</button>
        <button className="btn-publish">Publish</button>
      </div>
    </header>
  );
}

export function Toolbar() {
  const { s, dispatch } = useApp();
  const suggOpen = s.panelOpen && s.tab === "suggestions";
  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button className="tbtn" aria-label="Outline"><Icon name="list" /></button>
        <button className="tbtn" aria-label="Collapse all"><Icon name="unfold-less" /></button>
      </div>
      <div className="toolbar__group toolbar__group--right">
        <button className="tbtn" aria-label="Search questions"><Icon name="search" /></button>
        <button className="tbtn" aria-label="Undo (⌘Z)" title="Undo ⌘Z" disabled={!s.ops.length} onClick={() => dispatch({ type: "undo" })}>
          {/* "redo.svg" in the export is the same arrow in the grey disabled colour */}
          <Icon name={s.ops.length ? "undo" : "redo"} />
        </button>
        <button className="tbtn tbtn--flip" aria-label="Redo (⇧⌘Z)" title="Redo ⇧⌘Z" disabled={!s.redo.length} onClick={() => dispatch({ type: "redo" })}>
          <Icon name={s.redo.length ? "undo" : "redo"} />
        </button>
        <button
          className={`tbtn ${suggOpen ? "tbtn--active" : ""}`}
          aria-label="Suggestions"
          aria-pressed={suggOpen}
          title="Suggestions"
          onClick={() => (suggOpen ? dispatch({ type: "closePanel" }) : dispatch({ type: "openList" }))}
        >
          <Icon name="ai-magic" />
        </button>
        <button className="tbtn" aria-label="Download questionnaire"><Icon name="download" /></button>
        <button className="tbtn" aria-label="Settings"><Icon name="settings" /></button>
      </div>
    </div>
  );
}
