import * as React from 'react';
import * as superagent from 'superagent';
import Cookies from 'universal-cookie';
import './style.scss';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RequirementCard from '../../components/requirement-card';

import {Mixer} from '../../color-mixer';

const priorityColorMixer = new Mixer([
  [0, 255, 0],
  [255, 255, 0],
  [255, 0, 0],
]);

const {useEffect, useState} = React;

const cookies = new Cookies();

const API_URL = 'http://localhost:2898/'; //'https://runecomper.herokuapp.com/';

export interface Requirement {
  complete: boolean;
  eligible: boolean;
  name: string;
  page: string;
  level?: number;
  type: string;
  priority: number;
  order: number;
  skills: Requirement[];
  quests: Requirement[];
  achievements: Requirement[];
  maximumLevelRequirement: number;
}

export interface Profile {
  name: string;
  totallevel: number;
  totalxp: number;
  loggedIn: boolean;
  minOrder: number;
  maxOrder: number;
  skills: {[x: string]: {level: number; xp: number}};
  quests: {[x: string]: {completed: boolean; userEligible: boolean}};
  achievements: {[x: string]: boolean};
  miniquests: {[x: string]: boolean};
}

const updating = {
  counter: 0,
  add() {
    return ++this.counter;
  },
  sub() {
    return --this.counter;
  },
};

export default function Header(props: {match: {params: {user: string}}}) {
  const {user} = props.match.params;

  const [update, setUpdate] = useState(0);
  const [requirements, setRequirements] = useState([] as Requirement[]);

  const [quests, setQuests] = useState([] as Requirement[]);
  const [skills, setSkills] = useState([] as Requirement[]);
  const [achievs, setAchievs] = useState([] as Requirement[]);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [loading, setLoading] = useState(0);

  const [profile, setProfile] = useState({} as Profile | null);

  const [error, setError] = useState('');

  function fetchRequirements() {
    (async () => {
      setLoading(updating.add());
      const {body: requirements} = await superagent.get(API_URL);
      if (!requirements || !Array.isArray(requirements)) {
        setError("Couldn't get requirements");
        return;
      }
      setRequirements(requirements);
      setLoading(updating.sub());
    })().catch(() => {
      setError('Failed to fetch requirements');
    });
  }

  function fetchProfile() {
    (async () => {
      setLoading(updating.add());
      setProfile(null);
      const {body} = await superagent.get(`${API_URL}${user}`);
      const profile = body as Profile;
      let achievementUnlocks = cookies.get(`achievements-${user}`);
      if (!achievementUnlocks) {
        achievementUnlocks = {};
        cookies.set(`achievements-${user}`, achievementUnlocks);
      }
      profile.achievements = achievementUnlocks;
      setProfile(profile);
      setLoading(updating.sub());
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
          (profile.quests[name] && profile.quests[name].completed) ||
          profile.achievements[name]
        ) {
          requirement.complete = true;
        } else {
          if (
            profile.minOrder === undefined ||
            profile.minOrder > requirement.order
          ) {
            profile.minOrder = requirement.order;
          }
          if (
            profile.maxOrder === undefined ||
            profile.maxOrder < requirement.order
          ) {
            profile.maxOrder = requirement.order;
          }
          requirement.complete = false;
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
      setCompletionPercent(
        (requirements.reduce(
          (total, req) => total + (req.complete ? 1 : 0),
          0
        ) /
          requirements.length) *
          100
      );
    })();
  }

  useEffect(fetchRequirements, []);
  useEffect(() => {
    fetchProfile();
    setError('');
  }, [user]);
  useEffect(sortRequirements, [profile, requirements, update]);

  return loading && !error ? (
    <>
      <h1 id="loading">Loading...</h1>
    </>
  ) : (
    <section id="completionist-requirements">
      <div id="info">
        <h1>
          Comp Reqs for: <span id="username">{user}</span>
        </h1>
        <h2 id="comp-percent">
          Completion percent:{' '}
          <span
            style={{
              color: `${(() => {
                const g = 255 * completionPercent;
                const rb = 255 - g;
                let color = ((rb << 16) | (g << 8)).toString(16);
                while (color.length < 6) {
                  color = `0${color}`;
                }
                return `#${color}`;
              })()}`,
            }}
          >{`${completionPercent.toFixed(2)}%`}</span>
        </h2>
      </div>
      {error || !profile ? (
        <h3>{error || 'No profile..'}</h3>
      ) : (
        <section id="requirements">
          <section id="quests" className="requirement">
            <h2>Quests</h2>
            <ul>
              {quests.map(requirement => (
                <RequirementCard
                  key={requirement.name}
                  requirement={requirement}
                  profile={profile}
                  updateProfile={() => {
                    console.log('WTF');
                    cookies.set(`achievements-${user}`, profile?.achievements);
                    setUpdate(update + 1);
                  }}
                  mixer={priorityColorMixer}
                />
              ))}
            </ul>
          </section>
          <section id="skills" className="requirement">
            <h2>Skills</h2>
            <ul>
              {skills.map(requirement => (
                <RequirementCard
                  key={`${requirement.name}${requirement.level}`}
                  requirement={requirement}
                  profile={profile}
                  updateProfile={() => {
                    console.log('WTF');
                    cookies.set(`achievements-${user}`, profile?.achievements);
                    setUpdate(update + 1);
                  }}
                  mixer={priorityColorMixer}
                />
              ))}
            </ul>
          </section>
          <section id="achievements" className="requirement">
            <h2>Achievements</h2>
            <ul>
              {achievs.map(requirement => (
                <RequirementCard
                  key={`${requirement.name}${requirement.level}`}
                  requirement={requirement}
                  profile={profile}
                  updateProfile={() => {
                    cookies.set(`achievements-${user}`, profile?.achievements);
                    setUpdate(update + 1);
                  }}
                  mixer={priorityColorMixer}
                />
              ))}
            </ul>
          </section>
        </section>
      )}
    </section>
  );
}
