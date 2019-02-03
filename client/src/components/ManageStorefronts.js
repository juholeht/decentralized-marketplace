import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from '@material-ui/core/Typography';
import Paper from "@material-ui/core/Paper";
import Button from '@material-ui/core/Button';
import {connect} from 'react-redux';
import {Actions} from '../store/model'
import {withRouter} from 'react-router-dom';
import TextField from "@material-ui/core/TextField";
import {UsersUtil} from '../utils/users';
import {ContractAccess} from '../utils/contractAccess'
import web3 from 'web3';

const MAX_STOREFRONT_COUNT = 5;

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  button: {
    margin: theme.spacing.unit,
    marginTop: 20,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    margin: "auto",
    width: 700
  },
  control: {
    padding: theme.spacing.unit * 2
  },
  requestPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200
  },
});

class ManageStorefronts extends React.Component {
    state = {
        spacing: "16",
        open: false,
        name: "",
        storefronts: []
      };
    
      handleChange = name => event => {
        this.setState({
          [name]: event.target.value
        });
      };

      async componentDidMount() {
        const {contract} = this.props;
        if (contract !== null) {
          let storefronts = await this.fetchStorefronts();
          this.setState({ storefronts: storefronts });
        }
      }

      async componentDidUpdate(prevProps) {
        const {contract, userStatus} = this.props;
        if (contract !== prevProps.contract || userStatus !== prevProps.userStatus) {
          let storefronts = await this.fetchStorefronts();
          this.setState({ storefronts: storefronts });
        }
      }

      fetchStorefronts = async () => {
        const {contract, accounts, userStatus} = this.props;
        let storefronts = [];
        if (UsersUtil.isAdmin(userStatus)) {
          storefronts = await ContractAccess.getAllStorefronts(contract, accounts[0])
        } else if (accounts.length > 0 && UsersUtil.isShopOwner(userStatus)) {
          storefronts = await ContractAccess.getStorefrontsForOwner(contract, accounts[0], accounts[0]);
        }
        return storefronts;
      }

      removeStorefrontClicked = async (addr, index) => {
        const {contract, accounts} = this.props;
        const tx = await contract.methods.removeStorefront(addr, index).send({from: accounts[0]});
        if (tx.events.LogStorefrontRemoved) {
          let storefronts = await this.fetchStorefronts();
          this.setState({ storefronts: storefronts});
        }
      };

      manageProductsClicked = (name, addr, index) => {
        this.props.storefrontSelected({name: name, addr: addr, index: index});
        this.context.router.history.push("/manageproducts");
      };

      async createStorefrontClicked() {
        const {contract, accounts} = this.props;
        const {storefronts} = this.state;
        const tx = await contract.methods.addStorefront(this.state.name).send({from: accounts[0]});

        if (tx.events.LogNewStorefrontCreated) {
          const returnValues = tx.events.LogNewStorefrontCreated.returnValues;
          const storeFrontOwner = returnValues.owner;
          const name = returnValues.name;
          const balance = parseInt(returnValues.balance);
          const productCount = parseInt(returnValues.productCount);
          let storefrontsCopy = Object.assign([], storefronts);
          storefrontsCopy.push({owner: storeFrontOwner, name: name, balance: balance, productCount: productCount, index: storefrontsCopy.length});
          this.setState({ storefronts: storefrontsCopy});
        }

        this.setState({
          name: ""
        });
      };

      async createShopOwnerRequest() {
        const {contract, accounts} = this.props;
        const tx = await contract.methods.requestStoreOwnerStatus().send({from: accounts[0]});

        if (tx.events.LogStoreOwnerRightsRequested) {
          const returnValues = tx.events.LogStoreOwnerRightsRequested.returnValues;
          const addrWaitingApproval = returnValues.addr;
          if (addrWaitingApproval.toUpperCase() === accounts[0].toUpperCase()) {
            this.props.userStatusUpdated(UsersUtil.SHOPPER_WAITING_APPROVAL_STATUS);
          }
        }
      };

      isEqualAddress(addr1, addr2) {
        return (addr1.toUpperCase() === addr2.toUpperCase());
      }

      render() {
        const { classes, userStatus } = this.props;
        const { spacing, storefronts } = this.state;
        const isAdmin = UsersUtil.isAdmin(userStatus);
        const isShopper = UsersUtil.isShopper(userStatus);
        const isWaitingApproval = UsersUtil.isShopperWaitingApproval(userStatus);
        if (isWaitingApproval) {
          return (
            <div>
              <Paper className={classes.requestPaper} elevation={1}>
                <Typography variant="h5" component="h3">
                  Requested has been made.
                </Typography>
                <Typography component="p">
                  Admin will grant rights after request has been reviewed.
                </Typography>
              </Paper>
            </div>
          );
        }

        if (isShopper) {
          return (
            <div>
              <Paper className={classes.requestPaper} elevation={1}>
                <Typography variant="h5" component="h3">
                  Would you like to sell something?
                </Typography>
                <Typography component="p">
                  You can request Shop owner rights. Admin will grant rights after request has been made.
                </Typography>
                <Button variant="contained" color="primary" className={classes.button} onClick={() => this.createShopOwnerRequest()}>
                  Create request
                </Button>
              </Paper>
            </div>
          );
        }

        var maxStorefrontCountReached = !isAdmin && (storefronts.length >= MAX_STOREFRONT_COUNT);

        return (
          <div>
            <Paper className={classes.paper}>
              <Typography variant="h5" component="h3">
                  Create new storefront
              </Typography>
              <form className={classes.container} noValidate autoComplete="off">
                <TextField
                  id="standard-name"
                  label="Name"
                  className={classes.textField}
                  value={this.state.name}
                  onChange={this.handleChange("name")}
                  margin="normal"
                />
              </form>
              <Button variant="contained" disabled={maxStorefrontCountReached} className={classes.button} onClick={() => this.createStorefrontClicked()}>
                Create
              </Button>
            </Paper>
            <br></br>
          <Grid container className={classes.root} spacing={16}>
            <Grid item xs={12}>
              <Grid
                container
                className={classes.demo}
                justify="center"
                spacing={Number(spacing)}
              >
                {storefronts.map((storefront, index) => (
                  <Grid key={index} item>
                    <Paper className={classes.paper}>
                        <Grid container spacing={16}>
                        <Grid item xs={12} sm container>
                            <Grid item xs container direction="column" spacing={16}>
                            <Grid item xs>
                                <Typography gutterBottom variant="subtitle1">
                                {storefront.name}
                                </Typography>
                                <Typography color="textSecondary">Owner: {storefront.owner}</Typography>
                            </Grid>
                            <Grid item>
                            <Button variant="contained" color="primary" className={classes.button} onClick={() => this.manageProductsClicked(storefront.name, storefront.owner, storefront.index)}>
                                Manage products
                            </Button>
                            <Button variant="contained" color="secondary" className={classes.button} onClick={() => this.removeStorefrontClicked(storefront.owner, storefront.index)}>
                                Remove store
                            </Button>
                            </Grid>
                            </Grid>
                            <Grid item>
                            <Typography variant="subtitle1">Product count: {storefront.productCount}</Typography>
                            <Typography variant="subtitle1">Balance: {web3.utils.fromWei(storefront.balance.toString(), "ether")} Ξ</Typography>
                            </Grid>
                        </Grid>
                        </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
          </div>
        );
      }
    }
    
    ManageStorefronts.propTypes = {
      classes: PropTypes.object.isRequired
    };

    ManageStorefronts.contextTypes = {
        router: PropTypes.object
    };

    const mapStateToProps = (state) => {
        return {
          userStatus: state.userStatus,
          accounts: state.accounts,
          contract: state.contract
        }
    }
  
    const mapDispatchToProps = (dispatch) => {
        return {
            storefrontSelected(storefront){dispatch(Actions.storefrontSelected(storefront))},
            pageSelected(page){dispatch(Actions.pageSelected(page))},
            userStatusUpdated(userStatus){dispatch(Actions.userStatusUpdated(userStatus))}
        }
    }

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
    )(withStyles(styles)(ManageStorefronts)))
