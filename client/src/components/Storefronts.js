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
import {ContractAccess} from '../utils/contractAccess'

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  button: {
    margin: theme.spacing.unit,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    margin: "auto",
    width: 520
  },
  control: {
    padding: theme.spacing.unit * 2
  }
});

class Storefronts extends React.Component {
    state = {
        spacing: "16",
        storefronts: []
      };

      async componentDidMount() {
        const {contract} = this.props;
        if (contract !== null) {
          const storefronts = await ContractAccess.getAllStorefronts(contract);
          this.setState({ storefronts: storefronts });
        }
      }

      async componentDidUpdate(prevProps) {
        const {contract} = this.props;
        if (contract !== prevProps.contract) {
          const storefronts = await ContractAccess.getAllStorefronts(contract);
          this.setState({ storefronts: storefronts });
        }
      }

      checkProductsClicked = (name, addr, index) => {
        this.props.storefrontSelected({name: name, addr: addr, index: index});
        this.context.router.history.push("/products");
        this.props.pageSelected("products");
      };
    
      render() {
        const { classes } = this.props;
        const { storefronts } = this.state;
        const { spacing } = this.state;

        if (storefronts.length === 0) {
            return (<div>
            <Paper className={classes.paper} elevation={1}>
              <Typography variant="h5" component="h3">
                No stores available
              </Typography>
            </Paper>
          </div>);
        }
        return (
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
                            <Button variant="contained" className={classes.button} disabled={storefront.productCount === 0} onClick={() => this.checkProductsClicked(storefront.name, storefront.owner, storefront.index)}>
                                Check products
                            </Button>
                            </Grid>
                            </Grid>
                            <Grid item>
                            <Typography variant="subtitle1">Product count: {storefront.productCount}</Typography>
                            </Grid>
                        </Grid>
                        </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );
      }
    }
    
    Storefronts.propTypes = {
      classes: PropTypes.object.isRequired
    };

    Storefronts.contextTypes = {
        router: PropTypes.object
    };

    const mapStateToProps = (state) => {
        return {contract: state.contract}
    }
  
    const mapDispatchToProps = (dispatch) => {
        return {
            storefrontSelected(product){dispatch(Actions.storefrontSelected(product))},
            pageSelected(page){dispatch(Actions.pageSelected(page))}
        }
    }

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
    )(withStyles(styles)(Storefronts)))
