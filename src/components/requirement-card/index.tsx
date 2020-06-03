/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';

import './style.scss';

export default function RequirementCard({
  name,
  page,
  eligible,
}: {
  name: string;
  page: string;
  eligible: boolean;
}) {
  return (
    <li>
      <a
        href={`https://runescape.wiki${page}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <article className={`requirement ${eligible ? 'eligible' : ''}`}>
          <h3>{name}</h3>
        </article>
      </a>
    </li>
  );
}
