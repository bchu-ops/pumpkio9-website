import React from 'react'
import '../../App.css'
import './Interests.css'
import { publicFile } from '../../App'

const INTERESTS = [
  {
    title: 'F1 Racing',
    description: 'Huge fan of Formula 1, watching the speed, strategy, and engineering behind every race.',
    image: 'images/interests/f1.png',
  },
  {
    title: 'Go-Karting',
    description: 'Love driving fast and on the limit. One day soon, I want to build my own go-kart from scratch.',
    image: 'images/interests/gokart.png',
  },
  {
    title: 'Football',
    description: 'Neymar fan is my favorite player since I was playing as a kid and is a joy to watch. The flair, the skills, the beautiful game.',
    image: 'images/interests/neymar.png',
  },
  {
    title: 'Nature & Outdoors',
    description: 'Mountains, forests, lakes, all relaxing and refreshing. Maybe it\'s time to start going on hikes again. :D',
    image: 'images/interests/nature1.jpg',
  },
  {
    title: 'Scenic Views',
    description: 'Chasing golden light and landscapes. I could stare at a view like this for hours.',
    image: 'images/interests/nature2.jpg',
  },
  {
    title: 'Jiufen, Taiwan',
    description: 'Taiwan is almost my second home. The Spirited Away vibes of Jiufen Old Street.',
    image: 'images/interests/jiufen.png',
  },
];

export default function Interests() {
  return (
    <div className="interests-page">
      <h1 className="interests-title">Things I Love</h1>
      <p className="interests-subtitle">A few of my passions outside of engineering</p>

      <div className="interests-grid">
        {INTERESTS.map((item) => (
          <div key={item.title} className="interest-card">
            <div className="interest-card-image">
              <img src={publicFile(item.image)} alt={item.title} />
            </div>
            <div className="interest-card-body">
              <h3 className="interest-card-title">{item.title}</h3>
              <p className="interest-card-text">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
