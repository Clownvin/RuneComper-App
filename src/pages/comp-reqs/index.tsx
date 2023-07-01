import * as React from 'react';
import * as superagent from 'superagent';
import Cookies from 'universal-cookie';
import './style.scss';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RequirementCard from '../../components/requirement-card';

import {Mixer} from '../../color-mixer';
import {Dictionary, keyBy} from 'lodash';

const priorityColorMixer = new Mixer([
  [0, 255, 0],
  [255, 255, 0],
  [255, 0, 0],
]);

const {useEffect, useState} = React;

const cookies = new Cookies();

const API_URL = 'http://localhost:2898/';

type RequirementType = 'quest' | 'skill' | 'achievement';

export interface Requirement {
  required?: boolean;
  complete: boolean;
  eligible: boolean;
  name: string;
  page: string;
  icon: string;
  level?: number;
  type: RequirementType;
  // priority: number;
  order: number;
  skills: Requirement[];
  quests: Requirement[];
  achievements: Requirement[];
  maxLevel: number;
}

export interface Profile {
  name: string;
  totallevel: number;
  totalxp: number;
  loggedIn: boolean;
  minOrder: number;
  maxOrder: number;
  skills: {[x: string]: {level: number; xp: number} | undefined};
  quests: {
    [x: string]: {completed: boolean; userEligible: boolean} | undefined;
  };
  achievements: {[x: string]: boolean | undefined};
  miniquests: {[x: string]: boolean | undefined};
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
  const [selectedRequirement, setSelectedRequirement] = useState<
    Requirement | undefined
  >(undefined);
  console.log('SelectedRequiement', selectedRequirement);

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
      console.log('GETTING', API_URL);
      const {body: requirements} = await superagent.get(API_URL);
      if (!requirements || !Array.isArray(requirements)) {
        setError("Couldn't get requirements");
        return;
      }
      setRequirements(requirements.map((r, i) => ({...r, order: i})));
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
      // let questUnlocks = cookies.get(`quests-${user}`);
      // if (questUnlocks) {
      //   console.log('Got quest unlcoks', questUnlocks);
      //   for (const name in questUnlocks) {
      //     const quest = profile.quests[name];
      //     if (quest) {
      //       quest.completed = questUnlocks[name].completed;
      //     } else {
      //       profile.quests[name] = questUnlocks[name];
      //     }
      //   }
      // } else {
      //   console.log('NO QUESTS')
      //   cookies.set(`quests-${user}`, {})
      // }
      profile.achievements = achievementUnlocks;
      setProfile(profile);
      setLoading(updating.sub());
    })().catch(() => {
      setError('Failed to fetch profile');
    });
  }

  function traverseSelected(
    reqMap: Dictionary<Requirement>,
    includeRecommended = true,
    requirement = selectedRequirement as Requirement,
    seen = new Set<Requirement>()
  ) {
    seen.add(requirement);
    for (const {name, type, level} of [
      ...(requirement.achievements ?? []),
      ...(quests =>
        includeRecommended ? quests : quests.filter(q => q.required))(
        requirement.quests ?? []
      ),
      ...(requirement.skills ?? []),
    ]) {
      const n = type === 'skill' ? `${name}${level}` : name;
      const req = reqMap[n];
      if (!req) {
        console.warn('NO REQ FOR', n);
      }
      if (seen.has(req)) {
        continue;
      }
      traverseSelected(reqMap, includeRecommended, req, seen);
    }
    return seen;
  }

  function sortRequirements() {
    if (!requirements) {
      return;
    }
    console.log(profile ?? '');
    (async () => {
      if (!profile) {
        return;
      }
      const skills = [] as Requirement[];
      const quests = [] as Requirement[];
      const achievs = [] as Requirement[];
      let reqs = requirements.slice();
      const reqMap = keyBy(requirements, r =>
        r.type === 'skill' ? `${r.name}${r.level}` : r.name
      );
      if (selectedRequirement) {
        const allowed = traverseSelected(reqMap);
        console.log('Allowed:', allowed);
        reqs = reqs.filter(req => allowed.has(req));
      }
      reqs.forEach(requirement => {
        const {name, level, type} = requirement;
        if (
          (level && (profile.skills[name]?.level || 0) >= level) ||
          (profile.quests[name] && profile.quests[name]?.completed) ||
          (profile.quests[`${name} (miniquest)`] &&
            profile.quests[`${name} (miniquest)`]?.completed) ||
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
          if ((profile.skills[name]?.level || 0) >= (level || 0)) {
            continue;
          }
          return;
        }
        for (const {name} of requirement.quests.filter(
          q => reqMap[q.name] //.required
        )) {
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
  useEffect(sortRequirements, [
    profile,
    requirements,
    update,
    selectedRequirement,
  ]);

  return loading && !error ? (
    <>
      <h1 id="loading">Loading...</h1>
    </>
  ) : (
    <section id="completionist-requirements">
      <div id="info">
        <h2>
          Comp Reqs for: <span id="username">{user}</span>
        </h2>
        <h3 id="comp-percent">
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
        </h3>
        <button
          // disabled={!selectedRequirement}
          onClick={() => setSelectedRequirement(undefined)}
        >
          Unselect {selectedRequirement?.name}
        </button>
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
                  selected={requirement.name === selectedRequirement?.name}
                  setSelected={setSelectedRequirement}
                  profile={profile}
                  updateProfile={() => {
                    console.log('WTF');
                    cookies.set(`achievements-${user}`, profile?.achievements);
                    // console.log('Saving cookie?', profile.quests)
                    // cookies.set(`quests-${user}`, profile?.quests);
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
                  selected={requirement.name === selectedRequirement?.name}
                  setSelected={setSelectedRequirement}
                  profile={profile}
                  updateProfile={() => {
                    console.log('WTF');
                    cookies.set(`achievements-${user}`, profile?.achievements);
                    // console.log('Saving cookie?', profile.quests);
                    // cookies.set(`quests-${user}`, profile?.quests);
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
                  selected={requirement.name === selectedRequirement?.name}
                  setSelected={setSelectedRequirement}
                  profile={profile}
                  updateProfile={() => {
                    cookies.set(`achievements-${user}`, profile?.achievements);
                    // cookies.set(`quests-${user}`, profile?.quests);
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
