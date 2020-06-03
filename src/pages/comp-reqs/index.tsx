import * as React from 'react';
import * as superagent from 'superagent';
import './style.scss';

const {useEffect, useState} = React;

interface Requirement {
  name: string;
  page: string;
  level?: number;
  type: string;
  priority: number;
}

export default function Header(props: {match: {params: {user: string}}}) {
  const {user} = props.match.params;

  const [requirements, setRequirements] = useState([] as Requirement[]);

  const [quests, setQuests] = useState([] as Requirement[]);
  const [skills, setSkills] = useState([] as Requirement[]);
  const [achievs, setAchievs] = useState([] as Requirement[]);

  const [error, setError] = useState('');

  function fetchRequirements() {
    (async () => {
      const {body: requirements} = await superagent.get(
        'http://localhost:2898/'
      );
      if (!requirements || !Array.isArray(requirements)) {
        setError("Couldn't get requirements");
        return;
      }
      setRequirements(requirements);
    })();
  }

  function sortRequirements() {
    if (!requirements) {
      return;
    }
    (async () => {
      const {body: profile} = await superagent.get(
        `http://localhost:2898/${user}'`
      );
      const skills = [] as Requirement[];
      const quests = [] as Requirement[];
      const achievs = [] as Requirement[];
      requirements.forEach(requirement => {
        const {name, level, type} = requirement;
        if (
          (level && profile.skills[name].level >= level) ||
          (profile.quests[name] && profile.quests[name].completed)
        ) {
          return;
        }
        switch (type) {
          case 'quest':
            quests.push(requirement);
            break;
          case 'achievement':
            achievs.push(requirement);
            break;
          case 'skill':
            skills.push(requirement);
        }
      });
      setSkills(skills);
      setQuests(quests);
      setAchievs(achievs);
    })();
  }

  useEffect(fetchRequirements, []);
  useEffect(sortRequirements, [requirements, user]);

  return (
    <section id="completionist-requirements">
      <h1>
        Comp Reqs for: <span id="username">{user}</span>
      </h1>
      {error ? (
        error
      ) : (
        <section id="requirements">
          <section id="skills" className="requirement">
            <h2>Skills</h2>
            <ul>
              {skills.map(skill => (
                <li key={`${skill.name}${skill.level}`}>
                  <article className="requirement">
                    <h3>
                      {skill.name} {skill.level}
                    </h3>
                    <a href={`https://runescape.wiki${skill.page}`}>Page</a>
                  </article>
                </li>
              ))}
            </ul>
          </section>
          <section id="quests" className="requirement">
            <h2>Quests</h2>
            <ul>
              {quests.map(quest => (
                <li key={quest.name}>
                  <article className="requirement">
                    <h3>{quest.name}</h3>
                    <a href={`https://runescape.wiki${quest.page}`}>Page</a>
                  </article>
                </li>
              ))}
            </ul>
          </section>
          <section id="achievements" className="requirement">
            <h2>Achievements</h2>
            <ul>
              {achievs.map(achiev => (
                <li key={achiev.name}>
                  <article className="requirement">
                    <h3>{achiev.name}</h3>
                    <a href={`https://runescape.wiki${achiev.page}`}>Page</a>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        </section>
      )}
    </section>
  );
}
