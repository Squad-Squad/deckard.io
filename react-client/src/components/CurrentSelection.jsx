import React from 'react';

const CurrentSelection = props => (
  <article className="media Restaurant-list-item">
    <figure className="media-left">
      <p className="image is-square is-128x128">
        <img src={props.restaurant.image_url} className="restaurant-img hidden" />
      </p>
    </figure>
    <div className="media-content">
      <div className="content">
        <p>
          <strong>{props.restaurant.name}</strong>
        </p>
        <ul>
          {props.restaurant.categories.map((category, index) => {
            return <li key={index}>{category.title}</li>;
          })}
        </ul>
      </div>
    </div>
  </article>
);

export default CurrentSelection;
