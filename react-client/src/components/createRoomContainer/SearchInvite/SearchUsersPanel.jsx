import React from 'react';
import SearchResult from './SearchResult.jsx';
import InviteUsers from './InviteUsers.jsx';

class SearchUsersPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
    }

    this.enterQuery = this.enterQuery.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  enterQuery(e) {
    this.setState({
      query: e.target.value,
    });
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      this.props.searchUsers.call(this, this.state.query);
    }
  }

  render() {
    const usersFound = this.props.foundUsers.length ? (
      this.props.foundUsers.map((user, i) => (
        <SearchResult
          key={i}
          user={user}
          addCombatant={this.props.addCombatant} />
      ))
    ) : (
        <p>No results found.</p>
      )

    return (
      <article className="tile is-child notification">
        <div className="content">
          <div className="section">
            <p className="title">Find Fighters</p>
            <div className="content">
              <div className="field has-addons">
                <div className="control is-expanded">
                  <input
                    type="email"
                    className="input"
                    placeholder="Email"
                    value={this.state.query}
                    onChange={this.enterQuery}
                    onKeyPress={this.handleKeyPress} />
                </div>
                <div className="control">
                  <a
                    className="button is-info"
                    onClick={this.props.searchUsers.bind(this, this.state.query)}>
                    Search
                  </a>
                </div>
              </div>
            </div>
            <div>
              {usersFound}
            </div>
          </div>
          <div className="section">
            <div id="invite-users-footer" className="is-fullwidth">
              <div className="is-divider"></div>
              <InviteUsers />
            </div>
          </div>
        </div>
      </article >
    );
  }
}

export default SearchUsersPanel;
