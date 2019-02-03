import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';
import {connect} from 'react-redux';
import {Translator} from '../utils/translator';
import {UsersUtil} from '../utils/users';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  inline: {
    display: 'inline',
  },
  button: {
    margin: theme.spacing.unit,
  },
});

class Users extends React.Component {

    state = {
        users: []
    };

    async componentDidMount() {
        const {contract} = this.props;
        if (contract !== null) {
            this.fetchUsers();
        }
    }

    async componentDidUpdate(prevProps) {
        if (this.props.contract !== prevProps.contract) {
            this.fetchUsers();
        }
    }

    async fetchUsers() {
        const {contract, accounts} = this.props;
        const usersRaw = await contract.methods.getUsers().call({from: accounts[0]});
        this.setState({ users: Translator.convertUserData(usersRaw) });
    }

    async grantShopOwnerRightsClicked(addr) {
        const {contract, accounts} = this.props;
        const tx = await contract.methods.addStoreOwner(addr).send({from: accounts[0]});

        if (tx.events.LogStoreOwnerRightsGranted) {
            const returnValues = tx.events.LogStoreOwnerRightsGranted.returnValues;
            const changedAddress = returnValues.addr;
            const usersModified = this.updateUserStatus(changedAddress, Object.assign([], this.state.users), UsersUtil.SHOP_OWNER_STATUS);
            this.setState({usersModified});
        }
    }

    async grantAdminRightsClicked(addr) {
        const {contract, accounts} = this.props;
        const tx = await contract.methods.addAdmin(addr).send({from: accounts[0]});

        if (tx.events.LogAdminRightsGranted) {
            const returnValues = tx.events.LogAdminRightsGranted.returnValues;
            const changedAddress = returnValues.addr;
            const usersModified = this.updateUserStatus(changedAddress, Object.assign([], this.state.users), UsersUtil.ADMIN_STATUS);
            this.setState({usersModified});
        }
    }   

    updateUserStatus(addr, usersCopy, status) {
        return usersCopy.map((user, index) => {
            if (user.addr.toUpperCase() === addr.toUpperCase()) {
                user.status = status;
            }
            return user;
        });
    }

    removeUser(addr, usersCopy) {
        return usersCopy.filter(user => user.addr.toUpperCase() !== addr.toUpperCase());
    }

    async removeUserClicked(addr) {
        const {contract, accounts} = this.props;
        const {users} = this.state;
        const tx = await contract.methods.deleteUser(addr).send({from: accounts[0]});
        if (tx.events.LogDeleteUser) {
            const returnValues = tx.events.LogDeleteUser.returnValues;
            const removedUser = returnValues.addr;
            const usersModified = this.removeUser(removedUser, Object.assign([], users));
            this.setState({users: usersModified});
        }
    }

render() {
    const { classes, userStatus } = this.props;
    const { users } = this.state;
    const isAdmin = UsersUtil.isAdmin(userStatus);

    return (
        <List subheader={<ListSubheader>Users</ListSubheader>} className={classes.root}>
            {users.map((user, index) => (
                        <ListItem 
                        alignitems="flex-start"
                        key={index}>
                          <ListItemText
                          primary={user.addr}
                          secondary={
                              <React.Fragment>
                              <Typography component="span" className={classes.inline} color="textPrimary">
                                  Status:{' '}
                              </Typography>
                              {user.status}
                              </React.Fragment>
                          }
                          />
                          { isAdmin && UsersUtil.isShopper(user.status) ? <Button size="small" variant="contained" className={classes.button} onClick={() => this.grantShopOwnerRightsClicked(user.addr)}>
                                Grant Shop owner rights
                            </Button> : null }
                          { isAdmin && !UsersUtil.isAdmin(user.status) ? <Button size="small" variant="contained" className={classes.button} onClick={() => this.grantAdminRightsClicked(user.addr)}>
                                Grant Admin rights
                            </Button> : null }
                          { isAdmin && UsersUtil.isShopOwner(user.status) ? <Button size="small" variant="contained" className={classes.button} onClick={() => this.removeUserClicked(user.addr)}>
                                Remove user
                            </Button> : null }
                      </ListItem>
                ))}
        </List>
    );
    }
}

const mapStateToProps = (state) => {
    return {
        contract: state.contract,
        accounts: state.accounts,
        userStatus: state.userStatus 
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
    }
}


Users.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
    )(withStyles(styles)(Users))
