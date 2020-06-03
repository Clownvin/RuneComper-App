/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';

import './style.scss';

export default function RequirementCard({
  name,
  page,
  eligible,
  priority,
}: {
  name: string;
  page: string;
  eligible: boolean;
  priority: number;
}) {
  return (
    <li>
      <a
        className={`requirement ${eligible ? 'eligible' : ''}`}
        href={`https://runescape.wiki${page}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <article
          className={`requirement ${eligible ? 'eligible' : ''}`}
          style={{
            borderWidth: `${Math.max(Math.log(priority || 1) * 1.25, 10)}px`,
            borderColor: `${(() => {
              const g = Math.max(Math.min(Math.log(priority) * 25, 255), 0);
              const rb = 255 - g;
              let color = ((rb << 16) | (g << 8)).toString(16);
              while (color.length < 6) {
                color = `0${color}`;
              }
              return `#${color}`;
            })()}`,
            borderStyle: 'solid',
            boxShadow: `0 0 50px ${(() => {
              const g = Math.max(Math.min(Math.log(priority) * 25, 255), 0);
              const rb = 255 - g;
              let color = ((rb << 16) | (g << 8)).toString(16);
              while (color.length < 6) {
                color = `0${color}`;
              }
              return `#${color}`;
            })()}`,
          }}
        >
          <h3>{name}</h3>
        </article>
      </a>
    </li>
  );
}
