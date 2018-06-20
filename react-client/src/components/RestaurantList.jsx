import React from 'react';
import $ from 'jquery';
import RestaurantListItem from './RestaurantListItem.jsx';

class RestaurantList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      restaurants: [],
      isFirstTime: true,
    };
  }
  searchYelp() {
    $.post('/api/search', { zip: this.props.zipcode }, (data, status) => {
      console.log(`Requested Yelp search for ${this.props.zipcode}:`, status);
      if (data.businesses) {
        this.setState({
          restaurants: data.businesses,
        });
      }
    });
  }

  componentDidMount() {
    this.searchYelp();
  }

  componentDidUpdate() {
    this.setNominee();
  }

  //Attempt at getting Yelp information of the current nominee upon visiting the page
  setNominee() {
    if (this.state.isFirstTime && this.props.currentName) {
      this.state.restaurants.forEach(restaurant => {
        if (restaurant.name === this.props.currentName) {
          this.props.nominate(restaurant, true);
          this.setState({
            isFirstTime: false,
          });
        }
      });
    }
  }

  render() {
    // console.log('RESTAURANT LIST REJECTS', this.props.vetoedRestaurants)
    return (
      <div>
        <p className="title">Local Restaurants</p>
        {this.state.restaurants
        .filter(restaurant => {
          return !this.props.vetoedRestaurants.includes(restaurant.id);
        })
        .map(restaurant => {
          return <RestaurantListItem restaurant={restaurant} nominate={this.props.nominate} key={restaurant.id}/>;
        })}
      </div>
    );
  }
}
export default RestaurantList;
