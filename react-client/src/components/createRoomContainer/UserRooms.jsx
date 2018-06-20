import React from 'react';
import { Link } from 'react-router-dom';


class UserRooms extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
        <article className="tile is-child notification">
        <div className="content">
          <p className="title">Current Fights</p>
          {this.props.userRooms.map((room, index) => {
              return <div key={index}>
                      <Link to={`/rooms/${room.room_uniqueid}`} style={{ textDecoration: 'none' }}><button
                      className="button is-outlined is-primary is-small send-message is-fullWidth"
                      style={{width: "100%", margin: "1px"}}>
                      {room.room_name}
                      </button></Link>
                    </div>;
          })}
        </div>
      </article >
    );
  }
}

export default UserRooms;