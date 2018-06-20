import React from 'react';

class RestaurantListItem extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.props.nominate(this.props.restaurant);
  }

  render() {
    return (
      <article className="media Restaurant-list-item" onClick={this.handleClick}>
        <figure className="media-left">
          <p className="image is-square is-128x128">
            <img src={this.props.restaurant.image_url} className="restaurant-img hidden" />
          </p>
        </figure>
        <div className="media-content">
          <div className="content">
            <p>
              <strong>{this.props.restaurant.name}</strong>
            </p>
            <ul>
              {this.props.restaurant.categories.map((category, index) => {
                return <li key={index}>{category.title}</li>;
              })}
            </ul>
          </div>
        </div>
      </article>
    )
  }
}

export default RestaurantListItem;
