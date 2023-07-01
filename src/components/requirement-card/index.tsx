/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';

import './style.scss';
import {Requirement, Profile} from '../../pages/comp-reqs';
import {Mixer} from '../../color-mixer';
// import { queryByTestId } from '@testing-library/react';
// import { queryByTestId } from '@testing-library/react';

const {useState} = React;

function calculatePercent(step: number, min: number, max: number) {
  return (step - min) / (max - min);
}

export default function RequirementCard({
  profile,
  updateProfile,
  mixer,
  requirement,
  selected,
  setSelected,
}: {
  profile: Profile;
  updateProfile: () => void;
  selected: boolean;
  setSelected: (req: Requirement) => void;
  mixer: Mixer;
  requirement: Requirement;
}) {
  const {name, eligible, page, level} = requirement;
  const [update, setUpdate] = useState(0);

  const percent = calculatePercent(
    Math.max(requirement.order, profile.minOrder),
    profile.minOrder,
    profile.maxOrder
  );

  if (percent < 0 && profile) {
    throw new Error(
      'Got percent < 0, ' +
        requirement.order +
        ', ' +
        profile.minOrder +
        ', ' +
        profile.maxOrder
    );
  }

  const priorityColor = mixer.getFormatted(percent);
  return (
    <li
      className={`requirement ${eligible ? 'eligible' : ''} ${
        requirement.complete ? 'completed' : ''
      }`}
    >
      <article
        className={`requirement ${eligible ? 'eligible' : ''}`}
        onClick={() => {
          setUpdate(update + 1);
        }}
      >
        <header>
          <a
            className="requirement"
            href={`${page}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={requirement.icon}></img>
            <h3
              style={{
                color: priorityColor,
              }}
            >
              {requirement.type === 'skill'
                ? `${level} ${name[0].toUpperCase()}${name.substring(1)}`
                : name}
            </h3>
          </a>
          Completed:{' '}
          <input
            type="checkbox"
            checked={requirement.complete}
            onClick={_ => {
              requirement.complete = !requirement.complete;
              if (requirement.type === 'achievement') {
                profile.achievements[name] = !profile.achievements[name];
                updateProfile();
              }
              setUpdate(update + 1);
            }}
          ></input>
        </header>
        {/* <p>{JSON.stringify(requirement, null, 2)}</p> */}
        <section className="info" id={`${name}${level ?? ''}`}>
          <section className="quests">
            Quests
            {requirement.quests
              // .filter(q => q.required)
              .sort((a, b) => b.maxLevel - a.maxLevel)
              .map(quest => (
                <a href={`#${quest.name}`}>
                  {quest.name},{' '}
                  {(
                    profile.quests[quest.name] ??
                    profile.quests[`${quest.name} (miniquest)`] ?? {
                      completed: false,
                    }
                  ).completed
                    ? '✅'
                    : '❌'}
                </a>
              ))}
          </section>
          <section className="skills">
            Skills
            {requirement.skills
              .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
              .map(skill => (
                <div>
                  <img src={skill.icon}></img>
                  {skill.level} {skill.name},{' '}
                  {(profile.skills[skill.name]?.level || 0) >=
                  (skill.level ?? 0)
                    ? '✅'
                    : '❌'}
                </div>
              ))}
          </section>
          <section className="achievements">
            Achievements
            {requirement.achievements
              .sort((a, b) => b.maxLevel - a.maxLevel)
              .map(achiev => (
                <div>
                  {achiev.name},{' '}
                  {profile.achievements[achiev.name] ? '✅' : '❌'}
                </div>
              ))}
          </section>
        </section>
        {requirement.type !== 'skill' ? (
          <button disabled={selected} onClick={() => setSelected(requirement)}>
            Set Selected
          </button>
        ) : undefined}
      </article>
    </li>
  );
}
