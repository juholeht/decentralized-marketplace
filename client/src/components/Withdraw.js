import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';
import {connect} from 'react-redux';
import Button from '@material-ui/core/Button';
import web3 from 'web3';
import {UsersUtil} from '../utils/users';
import {ContractAccess} from '../utils/contractAccess'

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  inline: {
    display: 'inline',
  },
});

class Withdraw extends React.Component {

    state = {
        users: [],        
        storefronts: []
    };

    async componentDidMount() {
        const {contract, accounts, userStatus} = this.props;
        if (contract !== null) {
          let storefronts = [];
          if (UsersUtil.isAdmin(userStatus)) {
            storefronts = await ContractAccess.getAllStorefronts(contract)
          } else if (accounts.length > 0) {
            storefronts = await ContractAccess.getStorefrontsForOwner(contract, accounts[0]);
          }
          this.setState({ storefronts: storefronts });
        }
      }

      async componentDidUpdate(prevProps) {

        const {contract, accounts, userStatus} = this.props;
        if (contract !== prevProps.contract || userStatus !== prevProps.userStatus) {
          let storefronts = [];
          if (UsersUtil.isAdmin(userStatus)) {
            storefronts = await ContractAccess.getAllStorefronts(contract)
          } else if (accounts.length > 0) {
            storefronts = await ContractAccess.getStorefrontsForOwner(contract, accounts[0]);
          }
          this.setState({ storefronts: storefronts });
        }
      }

    async withdrawClicked(index, balance) {
        const {contract, accounts} = this.props;
        const { storefronts } = this.state;
        const tx = await contract.withdrawFunds(index, balance, {from: accounts[0]});
        if (tx.logs[0].event === "LogWithdraw") {
            const storeFrontOwner = tx.logs[0].args.addr;
            const storeIndex = parseInt(tx.logs[0].args.storeIndex);
            const withdrawedAmount = parseInt(tx.logs[0].args.amount);

            const updatedStorefronts = storefronts.map((storefront) => {
                if (storefront.owner.toUpperCase() === storeFrontOwner.toUpperCase() &&
                    storefront.index === storeIndex) 
                    {
                        storefront.balance -= withdrawedAmount;
                    }
                    return storefront;
            });
            this.setState({ storefronts: updatedStorefronts });
        }

    }   

    isEqualAddress(addr1, addr2) {
        return (addr1.toUpperCase() === addr2.toUpperCase());
    }

render() {
    const { classes, accounts } = this.props;
    const { storefronts } = this.state;
    return (
        <List subheader={<ListSubheader>Storefronts</ListSubheader>} className={classes.root}>
            {storefronts.length > 0 ? storefronts.map((storefront, index) => (
                        <ListItem 
                        alignitems="flex-start"
                        key={index}>
                          <ListItemText
                          primary={'Name: ' + storefront.name}
                          secondary={
                              <React.Fragment>
                              <Typography component="span" className={classes.inline} color="textPrimary">
                                  Balance:{' ' + web3.utils.fromWei(storefront.balance.toString(), "ether")} Ξ
                              </Typography>
                              <br/>
                              Owner: {' ' + storefront.owner}
                              </React.Fragment>
                          }
                          />
                          { storefront.balance > 0 && this.isEqualAddress(accounts[0], storefront.owner) ? 
                          <Button size="small" variant="contained" className={classes.button} onClick={() => this.withdrawClicked(storefront.index, storefront.balance)}>
                                Withdraw
                            </Button> : null }
                      </ListItem>
                )) :
                <ListItem 
                        alignitems="flex-start"
                        key="0">
                          <ListItemText
                          primary={'No stores available'}
                          />
                      </ListItem>
                }
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


Withdraw.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
    )(withStyles(styles)(Withdraw))
