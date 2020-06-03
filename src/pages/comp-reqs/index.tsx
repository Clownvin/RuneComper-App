import * as React from 'react';
import * as superagent from 'superagent';
import Cookies from 'universal-cookie';
import './style.scss';

const {useEffect, useState} = React;

const cookies = new Cookies();

const API_URL = 'https://runecomper.herokuapp.com/';

interface Requirement {
  eligible: boolean;
  name: string;
  page: string;
  level?: number;
  type: string;
  priority: number;
  skills: Requirement[];
  quests: Requirement[];
  achievements: Requirement[];
}

interface Profile {
  name: string;
  totallevel: number;
  totalxp: number;
  loggedIn: boolean;
  skills: {[x: string]: {level: number; xp: number}};
  quests: {[x: string]: {completed: boolean; userEligible: boolean}};
  achievements: {[x: string]: boolean};
  miniquests: {[x: string]: boolean};
}

export default function Header(props: {match: {params: {user: string}}}) {
  const {user} = props.match.params;

  const [requirements, setRequirements] = useState([] as Requirement[]);

  const [quests, setQuests] = useState([] as Requirement[]);
  const [skills, setSkills] = useState([] as Requirement[]);
  const [achievs, setAchievs] = useState([] as Requirement[]);

  const [profile, setProfile] = useState({} as Profile | null);

  const [error, setError] = useState('');

  function fetchRequirements() {
    (async () => {
      const {body: requirements} = await superagent.get(API_URL);
      if (!requirements || !Array.isArray(requirements)) {
        setError("Couldn't get requirements");
        return;
      }
      setRequirements(requirements);
    })().catch(() => {
      setError('Failed to fetch requirements');
    });
  }

  function fetchProfile() {
    (async () => {
      setProfile(null);
      const {body} = await superagent.get(`${API_URL}${user}`);
      const profile = body as Profile;
      let achievementUnlocks = cookies.get(`achievements-${user}`);
      if (!achievementUnlocks) {
        achievementUnlocks = {};
        cookies.set(`achievements-${user}`, achievementUnlocks);
      }
      profile.achievements = achievementUnlocks;
      let miniquests = cookies.get(`miniquests-${user}`);
      if (!miniquests) {
        miniquests = {};
        cookies.set(`miniquests-${user}`, miniquests);
      }
      profile.miniquests = miniquests;
      setProfile(profile);
    })().catch(() => {
      setError('Failed to fetch profile');
    });
  }

  function sortRequirements() {
    if (!requirements) {
      return;
    }
    (async () => {
      if (!profile) {
        return;
      }
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
        requirement.eligible = false;
        for (const {name, level} of requirement.skills) {
          if (profile.skills[name].level >= (level || 0)) {
            continue;
          }
          return;
        }
        for (const {name} of requirement.quests) {
          const status = profile.quests[name];
          if (!status && profile.miniquests[name as string]) {
            continue;
          }
          if (status && status.userEligible) {
            continue;
          }
          return;
        }
        for (const {name} of requirement.achievements) {
          if (profile.achievements[name]) {
            continue;
          }
          return;
        }
        requirement.eligible = true;
      });
      setSkills(skills);
      setQuests(quests);
      setAchievs(achievs);
    })();
  }

  useEffect(fetchRequirements, []);
  useEffect(fetchProfile, [user]);
  useEffect(sortRequirements, [requirements, profile]);

  return (
    <section id="completionist-requirements">
      <h1>
        Comp Reqs for: <span id="username">{user}</span>
      </h1>
      {error ? (
        <h3>{error}</h3>
      ) : (
        <section id="requirements">
          <section id="skills" className="requirement">
            <h2>Skills</h2>
            <ul>
              {skills.map(skill => (
                <li key={`${skill.name}${skill.level}`}>
                  <article
                    className={`requirement ${
                      skill.eligible ? 'eligible' : ''
                    }`}
                  >
                    <h3>
                      {skill.name} {skill.level}
                    </h3>
                    <a
                      href={`https://runescape.wiki${skill.page}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Page
                    </a>
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
                  <article
                    className={`requirement ${
                      quest.eligible ? 'eligible' : ''
                    }`}
                  >
                    <h3>{quest.name}</h3>
                    <a
                      href={`https://runescape.wiki${quest.page}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Page
                    </a>
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
                  <article
                    className={`requirement ${
                      achiev.eligible ? 'eligible' : ''
                    }`}
                  >
                    <h3>{achiev.name}</h3>
                    <a
                      href={`https://runescape.wiki${achiev.page}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Page
                    </a>
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
