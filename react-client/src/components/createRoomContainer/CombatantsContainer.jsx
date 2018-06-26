import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import { removeUserFromNewRoom } from '../../../../redux/actions.js';

const mapStateToProps = state => {
  return { usersForNewRoom: state.usersForNewRoom };
};

const mapDispatchToProps = dispatch => {
  return {
    removeUserFromNewRoom: (username) => dispatch(removeUserFromNewRoom(username)),
  };
};

const styles = theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  chip: {
    margin: theme.spacing.unit,
  },
});

function ConnectedCombatantsContainer(props) {
  const { classes } = props;
  return (
    <div>
      <Typography id="users-for-new-room-header">
        Users &ensp;<span style={{ flex: "right" }}>{props.usersForNewRoom.length}/7</span>
      </Typography>
      {
        props.usersForNewRoom.map((user, i) => {
          return (
            <div
              className={classes.root}
              key={i}>
              <Chip
                avatar={
                  <Avatar>
                    <FaceIcon />
                  </Avatar>
                }
                label={user}
                onDelete={() => props.removeUserFromNewRoom(user)}
                className={classes.chip}
              />
            </div>
          )
        })
      }
    </div>
  );
}

ConnectedCombatantsContainer.propTypes = {
  classes: PropTypes.object.isRequired,
};

const CombatantsContainer = withStyles(styles)(ConnectedCombatantsContainer);

export default connect(mapStateToProps, mapDispatchToProps)(CombatantsContainer);