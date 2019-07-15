import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {
  TouchableWithoutFeedback,
  Text,
  View
} from 'react-native';
import {shouldUpdate} from '../../../component-updater';
import isEqual from 'lodash.isequal';

import * as defaultStyle from '../../../style';
import styleConstructor from './style';

class Day extends Component {
  static propTypes = {
    // TODO: selected + disabled props should be removed
    state: PropTypes.oneOf(['selected', 'disabled', 'today', '']),

    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,
    marking: PropTypes.any,

    onPress: PropTypes.func,
    onLongPress: PropTypes.func,
    date: PropTypes.object,

    markingExists: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.theme = {...defaultStyle, ...(props.theme || {})};
    this.style = styleConstructor(props.theme);
    this.markingStyle = this.getDrawingStyle(props.marking || []);
    this.onDayPress = this.onDayPress.bind(this);
    this.onDayLongPress = this.onDayLongPress.bind(this);
  }

  onDayPress() {
    this.props.onPress(this.props.date);
  }

  onDayLongPress() {
    this.props.onLongPress(this.props.date);
  }

  shouldComponentUpdate(nextProps) {
    const newMarkingStyle = this.getDrawingStyle(nextProps.marking);

    if (!isEqual(this.markingStyle, newMarkingStyle)) {
      this.markingStyle = newMarkingStyle;
      return true;
    }
    // 增加对marking 字段的变化监听
    return shouldUpdate(this.props, nextProps, ['state', 'children','marking', 'onPress', 'onLongPress']);
  }

  getDrawingStyle(marking) {
    const defaultStyle = {textStyle: {}};
    if (!marking) {
      return defaultStyle;
    }
    if (marking.disabled) {
      defaultStyle.textStyle.color = this.theme.textDisabledColor;
    } else if (marking.selected) {
      defaultStyle.textStyle.color = this.theme.selectedDayTextColor;
    }
    const resultStyle = ([marking]).reduce((prev, next) => {
      if (next.quickAction) {
        if (next.first || next.last) {
          prev.containerStyle = this.style.firstQuickAction;
          prev.textStyle = this.style.firstQuickActionText;
          if (next.endSelected && next.first && !next.last) {
            prev.rightFillerStyle = '#c1e4fe';
          } else if (next.endSelected && next.last && !next.first) {
            prev.leftFillerStyle = '#c1e4fe';
          }
        } else if (!next.endSelected) {
          prev.containerStyle = this.style.quickAction;
          prev.textStyle = this.style.quickActionText;
        } else if (next.endSelected) {
          prev.leftFillerStyle = '#c1e4fe';
          prev.rightFillerStyle = '#c1e4fe';
        }
        return prev;
      }

      const color = next.color;
      if (next.status === 'NotAvailable') {
        prev.textStyle = this.style.naText;
      }
      if (next.startingDay) {
        prev.startingDay = {
          color
        };
      }
      if (next.endingDay) {
        prev.endingDay = {
          color
        };
      }
      // 在markedDates入参属性增加endingDayText 字段,为了显示结束语
      if (next.endingDay && next.endingDayText) {
        prev.endingDay.endingDayText = next.endingDayText;
      }
      if (!next.startingDay && !next.endingDay) {
        prev.day = {
            color
        };
      }
      if (next.textColor) {
        prev.textStyle.color = next.textColor;
      }
      return prev;
    }, defaultStyle);
    return resultStyle;
  }

  render() {
    const containerStyle = [this.style.base];
    const textStyle = [this.style.text];
    let leftFillerStyle = {};
    let rightFillerStyle = {};
    let fillerStyle = {};
    let fillers;

    let isDisabled = this.props.state === 'disabled';
    if (typeof this.props.disableDate === 'function') {
      isDisabled = this.props.disableDate(this.props.date)
    }

    if (isDisabled) {
      textStyle.push(this.style.disabledText);
    } else if (this.props.state === 'today') {
      containerStyle.push(this.style.today);
      textStyle.push(this.style.todayText);
    }

    if (this.props.marking) {
      containerStyle.push({
        borderRadius: 22,
      });

      const flags = this.markingStyle;
      if (flags.textStyle) {
        textStyle.push(flags.textStyle);
      }
      if (flags.containerStyle) {
        containerStyle.push(flags.containerStyle);
      }
      if (flags.leftFillerStyle) {
        leftFillerStyle.backgroundColor = flags.leftFillerStyle;
      }
      if (flags.rightFillerStyle) {
        rightFillerStyle.backgroundColor = flags.rightFillerStyle;
      }
      // 为了把开始选中的样式变为圆形，源码做了改动，154行if判断为true的块内容与179行的判断为true的块内容进行互换
      if (flags.startingDay && !flags.endingDay) {
          rightFillerStyle = {
              backgroundColor: this.theme.calendarBackground
          };
          leftFillerStyle = {
              backgroundColor: this.theme.calendarBackground
          };
          containerStyle.push({
              backgroundColor: flags.startingDay.color
          });
      } else if (flags.endingDay && !flags.startingDay) {
        rightFillerStyle = {
          backgroundColor: this.theme.calendarBackground
        };
        leftFillerStyle = {
          backgroundColor: flags.endingDay.color
        };
        containerStyle.push({
          backgroundColor: flags.endingDay.color
        });
      } else if (flags.day) {
        leftFillerStyle = {backgroundColor: flags.day.color};
        rightFillerStyle = {backgroundColor: flags.day.color};
        // #177 bug
        fillerStyle = {backgroundColor: flags.day.color};
      } else if (flags.endingDay && flags.startingDay) {
          leftFillerStyle = {
              backgroundColor: this.theme.calendarBackground
          };
          rightFillerStyle = {
              backgroundColor: flags.startingDay.color
          };
          containerStyle.push({
              backgroundColor: flags.startingDay.color
          });
      }

      fillers = (
        <View style={[this.style.fillers, fillerStyle]}>
          <View style={[this.style.leftFiller, leftFillerStyle]}/>
          <View style={[this.style.rightFiller, rightFillerStyle]}/>
        </View>
      );
    }
    // 在markedDates入参属性增加endingDayText 字段,为了显示结束语
    return (
      <TouchableWithoutFeedback
        onPress={this.onDayPress}
        onLongPress={this.onDayLongPress}>
        <View style={this.style.wrapper}>
          {fillers}
          <View style={containerStyle}>
            {
              this.markingStyle && this.markingStyle.endingDay && this.markingStyle.endingDay.endingDayText ?
                <Text style={textStyle}>{this.markingStyle.endingDay.endingDayText}</Text> : (
                <Fragment>
                    <Text allowFontScaling={false} style={textStyle}>{String(this.props.children)}</Text>
                    { this.props.subTextComponent ? this.props.subTextComponent(this.props.date, textStyle) : null }
                </Fragment>
              )
            }
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export default Day;
