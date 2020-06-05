/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';

import './style.scss';
import {Requirement, Profile} from '../../pages/comp-reqs';
import {Mixer} from '../../color-mixer';

const {useState} = React;

function calculatePercent(step: number, min: number, max: number) {
  return (step - min) / (max - min);
}

export default function RequirementCard({
  profile,
  updateProfile,
  mixer,
  requirement,
}: {
  profile: Profile;
  updateProfile: () => void;
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
          <h3
            style={{
              color: priorityColor,
            }}
          >
            {requirement.type === 'skill'
              ? `${level} ${name[0].toUpperCase()}${name.substring(1)}`
              : name}
          </h3>
        </header>
        {/* <p>{JSON.stringify(requirement, null, 2)}</p> */}
        <section className="info">
          <a
            className="requirement"
            href={`https://runescape.wiki${page}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            RuneScape Wiki
          </a>
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
        </section>
      </article>
    </li>
  );
}
